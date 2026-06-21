import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { matchService } from './match.service.js';
import { matchRepository } from '../repositories/match.repository.js';
import { emit } from '../sockets/index.js';

/**
 * MANUAL scoring engine — the admin drives every ball / goal. State is persisted
 * in matches.summary_json (so it survives restarts and feeds the public match
 * centre), scoring actions write `events` (triggers keep score/wickets/player_stats),
 * and every change is broadcast on match:update + match:state.
 */

const batRank = (pos: string) => (/Wicketkeeper|Batsman/.test(pos || '') ? 0 : /All-rounder/.test(pos || '') ? 1 : 2);
const oversStr = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

async function teamPlayers(teamId: number): Promise<{ id: number; name: string; pos: string }[]> {
  const [rows]: any = await pool.query(
    `SELECT id, name, position AS pos FROM players WHERE team_id = :teamId ORDER BY jersey_number`, { teamId });
  return rows;
}
function commentary(state: any, line: string) {
  state.commentary.unshift({ t: line, at: Date.now() });
  if (state.commentary.length > 60) state.commentary.length = 60;
}
async function loadState(matchId: number) {
  const s = await matchRepository.getSummary(matchId);
  return s?.summary ?? null;
}
async function persist(matchId: number, state: any) {
  await matchRepository.saveStateJson(matchId, JSON.stringify(state));
  const m = await matchRepository.findById(matchId);
  if (m) emit.matchUpdate(matchId, m);
  emit.matchState(matchId, state);
  return state;
}
const rawEvent = (matchId: number, teamId: number, playerId: number | null, eventType: string, value: number, minute: number) =>
  matchRepository.addEvent({ matchId, teamId, playerId, eventType, value, minute });

// ---------------------------------------------------------------------------
// CRICKET
// ---------------------------------------------------------------------------
function buildBatting(side: any) {
  const order = [...side.players].sort((a, b) => batRank(a.pos) - batRank(b.pos));
  return {
    teamId: side.id, teamName: side.name, score: 0, wickets: 0, balls: 0,
    strikerIdx: 0, nonStrikerIdx: 1,
    batsmen: order.map((p: any, i: number) => ({
      id: p.id, name: p.name, runs: 0, balls: 0, fours: 0, sixes: 0,
      out: false, dismissal: null, onCrease: i < 2,
    })),
  };
}
function buildBowling(side: any) {
  // auto-pick an opening bowler (prefer real bowlers)
  const bowlers = side.players.filter((p: any) => /Bowler|All-rounder/.test(p.pos));
  const first = (bowlers[0] ?? side.players[0]);
  return {
    teamId: side.id, teamName: side.name, players: side.players,
    currentBowlerId: first?.id ?? null,
    figures: first ? { [first.id]: { id: first.id, name: first.name, balls: 0, runs: 0, wickets: 0 } } : {},
  };
}
function recomputeRates(state: any) {
  const b = state.batting;
  state.currentRunRate = b.balls ? +(b.score / (b.balls / 6)).toFixed(2) : 0;
  if (state.innings === 2) {
    const ballsLeft = state.oversLimit * 6 - b.balls;
    state.required = Math.max(0, state.target - b.score);
    state.requiredRunRate = ballsLeft > 0 ? +(state.required / (ballsLeft / 6)).toFixed(2) : 0;
  }
}
function snapshotInnings(state: any) {
  return {
    teamId: state.batting.teamId, teamName: state.batting.teamName,
    score: state.batting.score, wickets: state.batting.wickets, overs: oversStr(state.batting.balls),
    batsmen: state.batting.batsmen.map((b: any) => ({ ...b })),
    bowlers: Object.values(state.bowling.figures).map((b: any) => ({ ...b })),
  };
}
async function assertCricket(matchId: number) {
  const m = await matchRepository.findById(matchId);
  if (!m) throw AppError.notFound('Match not found');
  if (m.sport_code !== 'CRICKET') throw AppError.badRequest('Not a cricket match');
  return m;
}

export const scoringService = {
  // ---- CRICKET ------------------------------------------------------------
  async cricketSetup(matchId: number, battingTeamId: number, oversLimit = 6) {
    const m = await assertCricket(matchId);
    if (!m.home_team_id || !m.away_team_id) throw AppError.badRequest('Both teams required');
    const home = { id: m.home_team_id, name: m.home_team, players: await teamPlayers(m.home_team_id) };
    const away = { id: m.away_team_id, name: m.away_team, players: await teamPlayers(m.away_team_id) };
    const batSide = battingTeamId === home.id ? home : away;
    const bowlSide = battingTeamId === home.id ? away : home;
    const state: any = {
      sport: 'CRICKET', status: 'live', oversLimit, innings: 1, target: null,
      home, away, battingSideId: batSide.id,
      batting: buildBatting(batSide), bowling: buildBowling(bowlSide),
      ballsThisOver: 0, oversCompleted: 0, thisOver: [],
      needNewBatsman: false, needNewBowler: false,
      currentRunRate: 0, firstInnings: null, secondInnings: null, commentary: [],
    };
    commentary(state, `${batSide.name} chose to bat. ${oversLimit} overs a side.`);
    if (m.status !== 'LIVE') await matchService.setStatus(matchId, 'LIVE');
    return persist(matchId, state);
  },

  async cricketBall(matchId: number, outcome: { runs?: number; wicket?: boolean; extra?: 'wide' | 'noball'; dismissal?: string }) {
    await assertCricket(matchId);
    const state = await loadState(matchId);
    if (!state || state.sport !== 'CRICKET') throw AppError.badRequest('Set up the innings first');
    if (state.status === 'completed') throw AppError.badRequest('Match already finished');
    if (state.needNewBatsman) throw AppError.badRequest('Select the next batsman first');
    if (state.needNewBowler) throw AppError.badRequest('Select the new bowler first');

    const bat = state.batting;
    const minute = state.innings;

    // extras: 1 run to team, not a legal ball, no batsman credit
    if (outcome.extra) {
      bat.score += 1;
      state.thisOver.push(outcome.extra === 'wide' ? 'wd' : 'nb');
      await rawEvent(matchId, bat.teamId, null, 'RUN', 1, minute);
      commentary(state, `${outcome.extra === 'wide' ? 'Wide' : 'No ball'} — 1 extra. ${bat.teamName} ${bat.score}/${bat.wickets}`);
      recomputeRates(state);
      return persist(matchId, state);
    }

    const striker = bat.batsmen[bat.strikerIdx];
    const bowler = state.bowling.figures[state.bowling.currentBowlerId];
    striker.balls++; bat.balls++; if (bowler) bowler.balls++; state.ballsThisOver++;

    if (outcome.wicket) {
      bat.wickets++; striker.out = true;
      striker.dismissal = outcome.dismissal || (bowler ? `b ${bowler.name}` : 'out');
      if (bowler) bowler.wickets++;
      state.thisOver.push('W');
      await rawEvent(matchId, state.bowling.teamId, bowler?.id ?? null, 'WICKET', 1, minute);
      commentary(state, `OUT! ${striker.name} ${striker.dismissal}. ${bat.teamName} ${bat.score}/${bat.wickets}`);
      if (bat.wickets >= 10) return this._endInnings(matchId, state);
      state.needNewBatsman = true;
    } else {
      const r = Math.max(0, Math.min(6, outcome.runs ?? 0));
      striker.runs += r; bat.score += r; if (bowler) bowler.runs += r;
      if (r === 4) striker.fours++; if (r === 6) striker.sixes++;
      state.thisOver.push(String(r));
      if (r > 0) await rawEvent(matchId, bat.teamId, striker.id, 'RUN', r, minute);
      commentary(state, `${oversStr(bat.balls)} — ${r === 4 ? 'FOUR!' : r === 6 ? 'SIX!' : r + ' run' + (r === 1 ? '' : 's')} ${striker.name} ${bat.score}/${bat.wickets}`);
      if (r % 2 === 1) [bat.strikerIdx, bat.nonStrikerIdx] = [bat.nonStrikerIdx, bat.strikerIdx];
    }

    // over complete
    if (state.ballsThisOver === 6) {
      state.ballsThisOver = 0; state.oversCompleted++;
      [bat.strikerIdx, bat.nonStrikerIdx] = [bat.nonStrikerIdx, bat.strikerIdx];
      state.thisOver = [];
      if (state.oversCompleted >= state.oversLimit) return this._endInnings(matchId, state);
      state.needNewBowler = true;
      commentary(state, `End of over ${state.oversCompleted} — ${bat.teamName} ${bat.score}/${bat.wickets}`);
    }
    if (state.innings === 2 && bat.score >= state.target) return this._endInnings(matchId, state);

    recomputeRates(state);
    return persist(matchId, state);
  },

  async cricketNewBatsman(matchId: number, playerId: number) {
    const state = await loadState(matchId);
    if (!state) throw AppError.badRequest('No live innings');
    const idx = state.batting.batsmen.findIndex((b: any) => b.id === playerId);
    if (idx < 0) throw AppError.badRequest('Player not in batting side');
    if (state.batting.batsmen[idx].out) throw AppError.badRequest('That batsman is already out');
    state.batting.batsmen[idx].onCrease = true;
    state.batting.strikerIdx = idx;
    state.needNewBatsman = false;
    commentary(state, `${state.batting.batsmen[idx].name} comes to the crease.`);
    return persist(matchId, state);
  },

  async cricketNewBowler(matchId: number, playerId: number) {
    const state = await loadState(matchId);
    if (!state) throw AppError.badRequest('No live innings');
    const p = state.bowling.players.find((x: any) => x.id === playerId);
    if (!p) throw AppError.badRequest('Player not in bowling side');
    state.bowling.currentBowlerId = playerId;
    if (!state.bowling.figures[playerId]) state.bowling.figures[playerId] = { id: p.id, name: p.name, balls: 0, runs: 0, wickets: 0 };
    state.needNewBowler = false;
    commentary(state, `${p.name} into the attack.`);
    return persist(matchId, state);
  },

  async _endInnings(matchId: number, state: any) {
    if (state.innings === 1) {
      state.firstInnings = snapshotInnings(state);
      state.target = state.batting.score + 1;
      const newBat = state.battingSideId === state.home.id ? state.away : state.home;
      const newBowl = state.battingSideId === state.home.id ? state.home : state.away;
      state.batting = buildBatting(newBat);
      state.bowling = buildBowling(newBowl);
      state.battingSideId = newBat.id;
      state.innings = 2;
      state.ballsThisOver = 0; state.oversCompleted = 0; state.thisOver = [];
      state.needNewBatsman = false; state.needNewBowler = false;
      commentary(state, `Innings break — target ${state.target}.`);
      recomputeRates(state);
      return persist(matchId, state);
    }
    state.secondInnings = snapshotInnings(state);
    return this.endMatch(matchId, state);
  },

  // allow admin to force end of an innings
  async cricketEndInnings(matchId: number) {
    const state = await loadState(matchId);
    if (!state) throw AppError.badRequest('No live innings');
    return this._endInnings(matchId, state);
  },

  // ---- FOOTBALL -----------------------------------------------------------
  async footballSetup(matchId: number) {
    const m = await matchRepository.findById(matchId);
    if (!m) throw AppError.notFound('Match not found');
    if (m.sport_code !== 'FOOTBALL') throw AppError.badRequest('Not a football match');
    const state: any = {
      sport: 'FOOTBALL', status: 'live', minute: 0,
      home: { id: m.home_team_id, name: m.home_team, score: 0 },
      away: { id: m.away_team_id, name: m.away_team, score: 0 },
      scorers: [], assists: [], cards: [], shots: { home: 0, away: 0 }, possession: { home: 50, away: 50 },
      commentary: [],
    };
    commentary(state, `Kick-off! ${m.home_team} vs ${m.away_team}.`);
    if (m.status !== 'LIVE') await matchService.setStatus(matchId, 'LIVE');
    return persist(matchId, state);
  },

  async footballGoal(matchId: number, input: { teamId: number; playerId: number; assistId?: number | null; minute: number; playerName?: string }) {
    const state = await loadState(matchId);
    if (!state || state.sport !== 'FOOTBALL') throw AppError.badRequest('Set up the match first');
    const side = input.teamId === state.home.id ? state.home : state.away;
    side.score++;
    await matchService.addEvent(matchId, { teamId: input.teamId, playerId: input.playerId, eventType: 'GOAL', value: 1, minute: input.minute }, { notify: true });
    const [[p]]: any = await pool.query(`SELECT name FROM players WHERE id=:id`, { id: input.playerId });
    let assistName = '';
    if (input.assistId) {
      const [[a]]: any = await pool.query(`SELECT name FROM players WHERE id=:id`, { id: input.assistId });
      assistName = a?.name ?? '';
      state.assists.push({ minute: input.minute, team: side.name, player: assistName });
      await matchService.addEvent(matchId, { teamId: input.teamId, playerId: input.assistId, eventType: 'ASSIST', value: 1, minute: input.minute }, { notify: false });
    }
    state.scorers.push({ minute: input.minute, team: side.name, player: p?.name ?? 'Player' });
    commentary(state, `⚽ ${input.minute}' GOAL! ${p?.name ?? ''} (${side.name})${assistName ? ' assist ' + assistName : ''}. ${state.home.name} ${state.home.score}-${state.away.score} ${state.away.name}`);
    return persist(matchId, state);
  },

  async footballCard(matchId: number, input: { teamId: number; playerId: number; type: 'YELLOW' | 'RED'; minute: number }) {
    const state = await loadState(matchId);
    if (!state || state.sport !== 'FOOTBALL') throw AppError.badRequest('Set up the match first');
    const side = input.teamId === state.home.id ? state.home : state.away;
    const [[p]]: any = await pool.query(`SELECT name FROM players WHERE id=:id`, { id: input.playerId });
    await matchService.addEvent(matchId, { teamId: input.teamId, playerId: input.playerId, eventType: input.type === 'RED' ? 'RED_CARD' : 'YELLOW_CARD', value: 1, minute: input.minute }, { notify: false });
    state.cards.push({ minute: input.minute, team: side.name, player: p?.name ?? 'Player', type: input.type });
    commentary(state, `${input.type === 'RED' ? '🟥' : '🟨'} ${input.minute}' ${p?.name ?? ''} (${side.name}).`);
    return persist(matchId, state);
  },

  async footballClock(matchId: number, minute: number) {
    const state = await loadState(matchId);
    if (!state || state.sport !== 'FOOTBALL') throw AppError.badRequest('Set up the match first');
    state.minute = minute;
    return persist(matchId, state);
  },

  // ---- shared finish ------------------------------------------------------
  computeMOM(state: any): { playerId: number; name: string; line: string } | null {
    if (state.sport === 'CRICKET') {
      const agg: Record<number, { name: string; runs: number; wkts: number }> = {};
      for (const inn of [state.firstInnings, state.secondInnings]) {
        if (!inn) continue;
        for (const b of inn.batsmen) { agg[b.id] = agg[b.id] || { name: b.name, runs: 0, wkts: 0 }; agg[b.id].runs += b.runs; }
        for (const bw of inn.bowlers) { agg[bw.id] = agg[bw.id] || { name: bw.name, runs: 0, wkts: 0 }; agg[bw.id].wkts += bw.wickets; }
      }
      let best: any = null;
      for (const [id, v] of Object.entries(agg)) {
        const sc = v.runs + v.wkts * 20;
        if (!best || sc > best.sc) best = { playerId: +id, name: v.name, sc, line: `${v.runs} runs, ${v.wkts} wkts` };
      }
      return best && { playerId: best.playerId, name: best.name, line: best.line };
    }
    // football
    const byName: Record<string, number> = {};
    const score: Record<number, { name: string; v: number }> = {};
    // need ids; scorers/assists store names — resolve from events would be heavy; approximate by name tally
    const tally: Record<string, { g: number; a: number }> = {};
    for (const s of state.scorers) tally[s.player] = tally[s.player] || { g: 0, a: 0 }, tally[s.player].g++;
    for (const a of state.assists) tally[a.player] = tally[a.player] || { g: 0, a: 0 }, tally[a.player].a++;
    let bestName: string | null = null; let bestV = -1;
    for (const [name, t] of Object.entries(tally)) { const v = t.g * 3 + t.a; if (v > bestV) { bestV = v; bestName = name; } }
    if (!bestName) return null;
    const t = tally[bestName];
    return { playerId: 0, name: bestName, line: `${t.g} goal${t.g !== 1 ? 's' : ''}, ${t.a} assist${t.a !== 1 ? 's' : ''}` };
  },

  resultText(state: any): string {
    if (state.sport === 'CRICKET') {
      const a = state.firstInnings, b = state.secondInnings;
      if (!a || !b) return 'Match completed';
      if (b.score >= state.target) return `${b.teamName} won by ${10 - b.wickets} wickets`;
      if (a.score > b.score) return `${a.teamName} won by ${a.score - b.score} runs`;
      return 'Match tied';
    }
    const hs = state.home.score, as = state.away.score;
    if (hs === as) return `Full time — ${hs} : ${as} draw`;
    return `${hs > as ? state.home.name : state.away.name} won ${Math.max(hs, as)}-${Math.min(hs, as)}`;
  },

  async endMatch(matchId: number, loaded?: any) {
    const state = loaded ?? (await loadState(matchId));
    if (!state) throw AppError.badRequest('No match in progress');
    state.status = 'completed';
    const mom = this.computeMOM(state);
    state.result = this.resultText(state);
    state.mom = mom;
    const m = await matchRepository.findById(matchId);
    const winner = m && m.home_score > m.away_score ? m.home_team_id
      : m && m.away_score > m.home_score ? m.away_team_id : null;
    await matchRepository.saveSummary(matchId, JSON.stringify(state), mom?.playerId || null);
    await matchService.setStatus(matchId, 'COMPLETED', winner ?? null);
    emit.matchState(matchId, state);
    return state;
  },
};
