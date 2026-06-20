import { pool } from '../config/db.js';
import { matchService } from './match.service.js';
import { matchRepository } from '../repositories/match.repository.js';
import { emit } from '../sockets/index.js';

/**
 * Advanced auto-simulation engine — drives live matches like a real broadcast.
 *  • Cricket: ball-by-ball with striker/non-striker/bowler, wickets bringing the
 *    next batsman, two innings, live commentary and a full scorecard.
 *  • Football: minute-by-minute goals/assists/cards + commentary.
 *  • Basketball: quarter-by-quarter scoring + commentary.
 * Each scoring action is written to `events` (so triggers keep score/player_stats
 * live), full rich state is broadcast on `match:state`, and at full time the
 * scorecard + Man of the Match are persisted to `matches.summary_json`.
 */

const TICK_MS = 3000;
const CRICKET_OVERS = 5;
const CRICKET_BALLS_PER_TICK = 2;
const TIMED_TICKS = 24; // football / basketball ticks

interface Runtime { sport: string; timer: NodeJS.Timeout; state: any; step: () => Promise<boolean> }
const sims = new Map<number, Runtime>();
let autoTimer: NodeJS.Timeout | null = null;
let autoCfg: { tournamentId?: number; max: number } | null = null;

const pick = (a: any[]): any => a[Math.floor(Math.random() * a.length)];
const chance = (p: number) => Math.random() < p;
const weighted = (pairs: [number, number][]): number => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pairs) { if ((r -= w) < 0) return v; }
  return pairs[0][0];
};

async function teamPlayers(teamId: number): Promise<{ id: number; name: string; pos: string }[]> {
  const [rows]: any = await pool.query(
    `SELECT id, name, position AS pos FROM players WHERE team_id = :teamId ORDER BY jersey_number`,
    { teamId },
  );
  return rows;
}
function commentary(state: any, line: string) {
  state.commentary.unshift({ t: line, at: Date.now() });
  if (state.commentary.length > 40) state.commentary.length = 40;
}
const rawEvent = (matchId: number, teamId: number, playerId: number | null, eventType: string, value: number, minute: number) =>
  matchRepository.addEvent({ matchId, teamId, playerId, eventType, value, minute });

// ===========================================================================
// CRICKET
// ===========================================================================
const batRank = (pos: string) => /Wicketkeeper|Batsman/.test(pos) ? 0 : /All-rounder/.test(pos) ? 1 : 2;
function buildBattingCard(side: { id: number; name: string; players: any[] }) {
  const order = [...side.players].sort((a, b) => batRank(a.pos) - batRank(b.pos));
  return {
    teamId: side.id, teamName: side.name, score: 0, wickets: 0, balls: 0,
    strikerIdx: 0, nonStrikerIdx: 1, nextIdx: 2,
    batsmen: order.map((p, i) => ({
      id: p.id, name: p.name, runs: 0, balls: 0, fours: 0, sixes: 0,
      out: false, dismissal: null as string | null, onCrease: i < 2,
    })),
  };
}
function newBowler(state: any) {
  const b = state.bowling;
  // prefer genuine bowlers / all-rounders, never the same bowler twice in a row
  const bowlerTypes = b.players.filter((p: any) => /Bowler|All-rounder/.test(p.pos) && p.id !== b.currentBowlerId);
  const candidates = bowlerTypes.length ? bowlerTypes : b.players.filter((p: any) => p.id !== b.currentBowlerId);
  const bowler = pick(candidates.length ? candidates : b.players);
  b.currentBowlerId = bowler.id;
  if (!b.figures[bowler.id]) b.figures[bowler.id] = { id: bowler.id, name: bowler.name, balls: 0, runs: 0, wickets: 0 };
}
function oversStr(balls: number) { return `${Math.floor(balls / 6)}.${balls % 6}`; }

function startCricketInnings(state: any, battingSide: any, bowlingSide: any) {
  state.batting = buildBattingCard(battingSide);
  state.bowling = {
    teamId: bowlingSide.id, teamName: bowlingSide.name, players: bowlingSide.players,
    currentBowlerId: null as number | null, figures: {} as Record<number, any>,
  };
  state.ballsThisOver = 0;
  state.thisOver = [];
  newBowler(state);
}

async function cricketBall(matchId: number, state: any): Promise<boolean> {
  const bat = state.batting;
  const striker = bat.batsmen[bat.strikerIdx];
  const bowler = state.bowling.figures[state.bowling.currentBowlerId];
  striker.balls++; bat.balls++; bowler.balls++; state.ballsThisOver++;
  const minute = state.innings === 1 ? 1 : 2;

  // outcome: 0,1,2,3,4,6 or wicket(-1)
  const out = weighted([[0, 30], [1, 30], [2, 12], [3, 3], [4, 13], [6, 6], [-1, 6]]);
  if (out === -1) {
    bat.wickets++; striker.out = true; bowler.wickets++;
    const how = pick([`b ${bowler.name}`, `c & b ${bowler.name}`, `lbw b ${bowler.name}`, `c †keeper b ${bowler.name}`, `run out`]);
    striker.dismissal = how;
    state.thisOver.push('W');
    commentary(state, `${oversStr(bat.balls)} — OUT! ${striker.name} ${how}. ${state.batting.teamName} ${bat.score}/${bat.wickets}`);
    await rawEvent(matchId, state.bowling.teamId, bowler.id, 'WICKET', 1, minute);
    if (bat.wickets < 10 && bat.nextIdx < bat.batsmen.length) {
      bat.strikerIdx = bat.nextIdx; bat.batsmen[bat.nextIdx].onCrease = true; bat.nextIdx++;
    }
  } else {
    const r = out;
    striker.runs += r; bat.score += r; bowler.runs += r;
    if (r === 4) { striker.fours++; commentary(state, `${oversStr(bat.balls)} — FOUR! ${striker.name} times it beautifully.`); }
    else if (r === 6) { striker.sixes++; commentary(state, `${oversStr(bat.balls)} — SIX! ${striker.name} goes big! 🚀`); }
    else if (r === 0) commentary(state, `${oversStr(bat.balls)} — dot ball, ${bowler.name} to ${striker.name}.`);
    else commentary(state, `${oversStr(bat.balls)} — ${r} run${r > 1 ? 's' : ''}, ${striker.name} works it around.`);
    state.thisOver.push(String(r));
    if (r > 0) await rawEvent(matchId, bat.teamId, striker.id, 'RUN', r, minute);
    if (r % 2 === 1) [bat.strikerIdx, bat.nonStrikerIdx] = [bat.nonStrikerIdx, bat.strikerIdx];
  }

  // over complete
  if (state.ballsThisOver === 6) {
    state.ballsThisOver = 0;
    [bat.strikerIdx, bat.nonStrikerIdx] = [bat.nonStrikerIdx, bat.strikerIdx];
    newBowler(state);
    state.thisOver = [];
    commentary(state, `End of over ${Math.floor(bat.balls / 6)} — ${bat.teamName} ${bat.score}/${bat.wickets}. ${state.bowling.figures[state.bowling.currentBowlerId].name} into the attack.`);
  }

  // run rates
  state.currentRunRate = bat.balls ? +(bat.score / (bat.balls / 6)).toFixed(2) : 0;
  if (state.innings === 2) {
    const ballsLeft = CRICKET_OVERS * 6 - bat.balls;
    state.required = Math.max(0, state.target - bat.score);
    state.requiredRunRate = ballsLeft > 0 ? +((state.required) / (ballsLeft / 6)).toFixed(2) : 0;
  }

  // innings / match end?
  const inningsDone = bat.wickets >= 10 || bat.balls >= CRICKET_OVERS * 6
    || (state.innings === 2 && bat.score >= state.target);
  if (!inningsDone) return false;

  if (state.innings === 1) {
    state.firstInnings = snapshotInnings(state);
    state.target = bat.score + 1;
    commentary(state, `Innings break — ${state.batting.teamName} ${bat.score}/${bat.wickets}. Target: ${state.target}.`);
    startCricketInnings(state, state.away, state.home); // away now bats (home bowled first)
    state.innings = 2;
    return false;
  }
  state.secondInnings = snapshotInnings(state);
  return true;
}
function snapshotInnings(state: any) {
  return {
    teamId: state.batting.teamId, teamName: state.batting.teamName,
    score: state.batting.score, wickets: state.batting.wickets, overs: oversStr(state.batting.balls),
    batsmen: state.batting.batsmen.map((b: any) => ({ ...b })),
    bowlers: Object.values(state.bowling.figures).map((b: any) => ({ ...b })),
  };
}

// ===========================================================================
// FOOTBALL
// ===========================================================================
async function footballStep(matchId: number, state: any): Promise<boolean> {
  state.tick++;
  const minute = Math.min(90, Math.round((state.tick / TIMED_TICKS) * 90));
  state.minute = minute;
  const side = () => pick([state.home, state.away]);
  const attacker = (s: any) => pick(s.players.filter((p: any) => /Forward|Midfielder/.test(p.pos)).length
    ? s.players.filter((p: any) => /Forward|Midfielder/.test(p.pos)) : s.players);

  if (state.tick === 1) commentary(state, `Kick-off! ${state.home.name} vs ${state.away.name}.`);
  if (state.tick === 12) commentary(state, `Half-time — ${state.home.name} ${state.home.score} : ${state.away.score} ${state.away.name}.`);

  // shots / possession drift (cosmetic realism)
  state.shots.home += chance(0.4) ? 1 : 0;
  state.shots.away += chance(0.4) ? 1 : 0;
  const poss = 50 + Math.round((Math.random() - 0.5) * 16);
  state.possession = { home: poss, away: 100 - poss };

  if (chance(0.22)) {
    const s = side(); const scorer = attacker(s);
    s.score++;
    await matchService.addEvent(matchId, { teamId: s.id, playerId: scorer.id, eventType: 'GOAL', value: 1, minute }, { notify: true });
    let assistTxt = '';
    if (chance(0.6)) { const a = attacker(s); if (a.id !== scorer.id) { state.assists.push({ minute, team: s.name, player: a.name }); assistTxt = ` (assist: ${a.name})`; await matchService.addEvent(matchId, { teamId: s.id, playerId: a.id, eventType: 'ASSIST', value: 1, minute }, { notify: false }); } }
    state.scorers.push({ minute, team: s.name, player: scorer.name });
    commentary(state, `⚽ ${minute}' GOAL! ${scorer.name} scores for ${s.name}${assistTxt}. ${state.home.name} ${state.home.score}-${state.away.score} ${state.away.name}`);
  }
  if (chance(0.12)) {
    const s = side(); const p = pick(s.players); const red = chance(0.12);
    state.cards.push({ minute, team: s.name, player: p.name, type: red ? 'RED' : 'YELLOW' });
    await matchService.addEvent(matchId, { teamId: s.id, playerId: p.id, eventType: red ? 'RED_CARD' : 'YELLOW_CARD', value: 1, minute }, { notify: false });
    commentary(state, `${red ? '🟥' : '🟨'} ${minute}' ${red ? 'Red' : 'Yellow'} card for ${p.name} (${s.name}).`);
  }

  if (state.tick >= TIMED_TICKS) { commentary(state, `Full-time! ${state.home.name} ${state.home.score} : ${state.away.score} ${state.away.name}.`); return true; }
  return false;
}

// ===========================================================================
// BASKETBALL
// ===========================================================================
async function basketballStep(matchId: number, state: any): Promise<boolean> {
  state.tick++;
  state.quarter = Math.min(4, Math.ceil(state.tick / (TIMED_TICKS / 4)));
  const side = () => pick([state.home, state.away]);
  if (state.tick === 1) commentary(state, `Tip-off! ${state.home.name} vs ${state.away.name}.`);

  const scoreOnce = () => {
    const s = side(); const p = pick(s.players); const pts = pick([2, 2, 2, 3]);
    s.score += pts; state.scorers[p.id] = state.scorers[p.id] || { name: p.name, team: s.name, points: 0 };
    state.scorers[p.id].points += pts;
    return rawEvent(matchId, s.id, p.id, 'POINT', pts, state.quarter).then(() => ({ s, p, pts }));
  };
  const a = await scoreOnce();
  if (chance(0.7)) await scoreOnce();
  if (chance(0.4)) await scoreOnce();
  if (chance(0.2)) { const s = side(); const p = pick(s.players); state.fouls[s === state.home ? 'home' : 'away']++; await rawEvent(matchId, s.id, p.id, 'FOUL', 1, state.quarter); }

  if (a.pts === 3) commentary(state, `Q${state.quarter} — ${a.p.name} drains a THREE for ${a.s.name}! ${state.home.name} ${state.home.score}-${state.away.score} ${state.away.name}`);
  else if (chance(0.3)) commentary(state, `Q${state.quarter} — ${a.p.name} scores. ${state.home.name} ${state.home.score}-${state.away.score} ${state.away.name}`);

  if (state.tick % (TIMED_TICKS / 4) === 0) {
    state.quarters.push({ q: state.quarter, home: state.home.score, away: state.away.score });
    commentary(state, `End of Q${state.quarter} — ${state.home.name} ${state.home.score} : ${state.away.score} ${state.away.name}.`);
  }
  if (state.tick >= TIMED_TICKS) { commentary(state, `Final buzzer! ${state.home.name} ${state.home.score} : ${state.away.score} ${state.away.name}.`); return true; }
  return false;
}

// ===========================================================================
// Man of the Match
// ===========================================================================
function computeMOM(state: any): { playerId: number; name: string; line: string } | null {
  if (state.sport === 'CRICKET') {
    const agg: Record<number, { name: string; runs: number; wkts: number }> = {};
    for (const inn of [state.firstInnings, state.secondInnings]) {
      if (!inn) continue;
      for (const b of inn.batsmen) { agg[b.id] = agg[b.id] || { name: b.name, runs: 0, wkts: 0 }; agg[b.id].runs += b.runs; }
      for (const bw of inn.bowlers) { agg[bw.id] = agg[bw.id] || { name: bw.name, runs: 0, wkts: 0 }; agg[bw.id].wkts += bw.wickets; }
    }
    let best: any = null;
    for (const [id, v] of Object.entries(agg)) {
      const score = v.runs + v.wkts * 20;
      if (!best || score > best.score) best = { playerId: +id, name: v.name, score, line: `${v.runs} runs, ${v.wkts} wkts` };
    }
    return best && { playerId: best.playerId, name: best.name, line: best.line };
  }
  if (state.sport === 'FOOTBALL') {
    const tally: Record<string, { id: number; name: string; g: number; a: number }> = {};
    for (const sc of state.scorers) { /* names only */ }
    // rebuild from events tally via scorers/assists lists keyed by name+team -> need ids; use players cache
    const byName: Record<string, any> = {};
    for (const s of [state.home, state.away]) for (const p of s.players) byName[p.name] = p;
    const score: Record<number, { name: string; v: number }> = {};
    for (const sc of state.scorers) { const p = byName[sc.player]; if (p) { score[p.id] = score[p.id] || { name: p.name, v: 0 }; score[p.id].v += 3; } }
    for (const as of state.assists) { const p = byName[as.player]; if (p) { score[p.id] = score[p.id] || { name: p.name, v: 0 }; score[p.id].v += 1; } }
    let best: any = null;
    for (const [id, v] of Object.entries(score)) if (!best || v.v > best.v) best = { playerId: +id, name: v.name, v: v.v };
    if (!best) return null;
    const goals = state.scorers.filter((s: any) => byName[s.player]?.id === best.playerId).length;
    const assists = state.assists.filter((s: any) => byName[s.player]?.id === best.playerId).length;
    return { playerId: best.playerId, name: best.name, line: `${goals} goal${goals !== 1 ? 's' : ''}, ${assists} assist${assists !== 1 ? 's' : ''}` };
  }
  // basketball
  let best: any = null;
  for (const [id, v] of Object.entries(state.scorers as Record<number, any>)) if (!best || v.points > best.points) best = { playerId: +id, ...v };
  return best && { playerId: best.playerId, name: best.name, line: `${best.points} points` };
}

function resultText(state: any, home: any, away: any): string {
  if (state.sport === 'CRICKET') {
    const a = state.firstInnings, b = state.secondInnings;
    if (!a || !b) return 'Match completed';
    if (b.score >= state.target) return `${b.teamName} won by ${10 - b.wickets} wickets`;
    if (a.score > b.score) return `${a.teamName} won by ${a.score - b.score} runs`;
    return 'Match tied';
  }
  const hs = home.score, as = away.score;
  if (hs === as) return `Match drawn ${hs}-${as}`;
  return `${hs > as ? home.name : away.name} won ${Math.max(hs, as)}-${Math.min(hs, as)}`;
}

// ===========================================================================
// lifecycle
// ===========================================================================
async function finalize(matchId: number, state: any) {
  state.status = 'completed';
  const mom = computeMOM(state);
  state.result = resultText(state, state.home, state.away);
  state.mom = mom;
  const m = await matchRepository.findById(matchId);
  const winner = m && m.home_score > m.away_score ? m.home_team_id
    : m && m.away_score > m.home_score ? m.away_team_id : null;
  await matchRepository.saveSummary(matchId, JSON.stringify(state), mom?.playerId ?? null);
  await matchService.setStatus(matchId, 'COMPLETED', winner ?? null);
  emit.matchState(matchId, state);
}

async function tick(matchId: number) {
  const rt = sims.get(matchId);
  if (!rt) return;
  let done = false;
  try { done = await rt.step(); } catch (e) { /* keep going */ }
  const m = await matchRepository.findById(matchId);
  if (m) emit.matchUpdate(matchId, m);
  emit.matchState(matchId, rt.state);
  if (done) { clearInterval(rt.timer); sims.delete(matchId); await finalize(matchId, rt.state); }
}

async function buildRuntime(matchId: number): Promise<Runtime | null> {
  const m = await matchRepository.findById(matchId);
  if (!m || !m.home_team_id || !m.away_team_id) return null;
  const home = { id: m.home_team_id, name: m.home_team!, score: 0, players: await teamPlayers(m.home_team_id) };
  const away = { id: m.away_team_id, name: m.away_team!, score: 0, players: await teamPlayers(m.away_team_id) };
  const base = { sport: m.sport_code, status: 'live', home, away, commentary: [] as any[], tick: 0 };

  if (m.sport_code === 'CRICKET') {
    const state: any = { ...base, innings: 1, oversLimit: CRICKET_OVERS, target: null, currentRunRate: 0 };
    startCricketInnings(state, home, away);
    commentary(state, `Match begins — ${home.name} batting first. ${CRICKET_OVERS} overs a side.`);
    return { sport: 'CRICKET', timer: null as any, state, step: async () => {
      for (let i = 0; i < CRICKET_BALLS_PER_TICK; i++) { if (await cricketBall(matchId, state)) return true; }
      return false;
    } };
  }
  if (m.sport_code === 'BASKETBALL') {
    const state: any = { ...base, quarter: 1, quarters: [], scorers: {}, fouls: { home: 0, away: 0 } };
    return { sport: 'BASKETBALL', timer: null as any, state, step: () => basketballStep(matchId, state) };
  }
  const state: any = { ...base, minute: 0, scorers: [], assists: [], cards: [], shots: { home: 0, away: 0 }, possession: { home: 50, away: 50 } };
  return { sport: 'FOOTBALL', timer: null as any, state, step: () => footballStep(matchId, state) };
}

async function nextScheduled(tournamentId?: number): Promise<number | null> {
  const where = tournamentId ? `AND tournament_id = :tid` : '';
  const [rows]: any = await pool.query(
    `SELECT id FROM matches WHERE status='SCHEDULED' AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL ${where} ORDER BY id LIMIT 1`,
    { tid: tournamentId ?? null });
  return rows[0]?.id ?? null;
}
async function liveUnsimulated(tournamentId?: number): Promise<number[]> {
  const where = tournamentId ? `AND tournament_id = :tid` : '';
  const [rows]: any = await pool.query(
    `SELECT id FROM matches WHERE status='LIVE' AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL ${where}`,
    { tid: tournamentId ?? null });
  return rows.map((r: any) => r.id).filter((id: number) => !sims.has(id));
}

export const simulationService = {
  status() { return { auto: !!autoTimer, tournamentId: autoCfg?.tournamentId ?? null, live: [...sims.keys()] }; },
  getState(matchId: number) { return sims.get(matchId)?.state ?? null; },

  async startMatch(matchId: number) {
    if (sims.has(matchId)) return;
    const m = await matchRepository.findById(matchId);
    if (!m || m.status === 'COMPLETED') return;
    const rt = await buildRuntime(matchId);
    if (!rt) return;
    if (m.status !== 'LIVE') await matchService.setStatus(matchId, 'LIVE');
    rt.timer = setInterval(() => { tick(matchId).catch(() => {}); }, TICK_MS);
    sims.set(matchId, rt);
    return this.status();
  },

  stopMatch(matchId: number) { const s = sims.get(matchId); if (s) { clearInterval(s.timer); sims.delete(matchId); } },

  async startAuto(tournamentId?: number, max = 2) {
    autoCfg = { tournamentId, max };
    if (autoTimer) return this.status();
    const loop = async () => {
      try {
        for (const id of await liveUnsimulated(autoCfg?.tournamentId)) await this.startMatch(id);
        while (sims.size < (autoCfg?.max ?? 2)) {
          const next = await nextScheduled(autoCfg?.tournamentId);
          if (!next) break;
          await this.startMatch(next);
        }
        if (sims.size === 0 && !(await nextScheduled(autoCfg?.tournamentId))) this.stopAuto();
      } catch { /* ignore */ }
    };
    autoTimer = setInterval(() => { loop().catch(() => {}); }, 4000);
    await loop();
    return this.status();
  },

  stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } autoCfg = null; },
  stopAll() { this.stopAuto(); for (const id of [...sims.keys()]) this.stopMatch(id); },
};
