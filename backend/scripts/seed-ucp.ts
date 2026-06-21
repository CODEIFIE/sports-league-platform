/**
 * UCP Gujranwala demo seed — cricket + football leagues, faculty teams, fake
 * players with avatars, and sample finished + LIVE matches (with full
 * broadcast scorecards). Replaces all existing data.
 *
 *   npm run db:seed:ucp
 */
import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

const avatar = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
const teamLogo = (name: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=8c1530,b21e3f,23355c`;

const FIRST = ['Ahmad', 'Bilal', 'Hamza', 'Usman', 'Zain', 'Hassan', 'Ali', 'Faizan', 'Saad', 'Umair',
  'Talha', 'Haris', 'Awais', 'Rizwan', 'Shoaib', 'Daniyal', 'Fahad', 'Noman', 'Asad', 'Kashif',
  'Owais', 'Sufyan', 'Arslan', 'Junaid', 'Waqas', 'Imran', 'Sajjad', 'Adnan', 'Naveed', 'Tariq'];
const LAST = ['Khan', 'Malik', 'Butt', 'Cheema', 'Gondal', 'Bhatti', 'Chaudhry', 'Awan', 'Sheikh',
  'Qureshi', 'Raza', 'Iqbal', 'Hussain', 'Ahmed', 'Javed', 'Nawaz', 'Aslam', 'Yousaf', 'Mehmood', 'Rashid'];

let nameIdx = 0;
function nextName() {
  const f = FIRST[nameIdx % FIRST.length];
  const l = LAST[(nameIdx * 7) % LAST.length];
  nameIdx++;
  return `${f} ${l}`;
}

const CRICKET_TEAMS = ['FOIT Falcons', 'FOMS Tigers', 'Engineering Eagles', 'Pharma Warriors'];
const FOOTBALL_TEAMS = ['FOIT United', 'FOMS City', 'Engineering FC', 'Life Sciences SC'];
const CR_POS = ['Batsman', 'Batsman', 'Wicketkeeper', 'All-rounder', 'All-rounder', 'Bowler', 'Bowler', 'Bowler'];
const FB_POS = ['Goalkeeper', 'Defender', 'Defender', 'Defender', 'Midfielder', 'Midfielder', 'Forward', 'Forward'];

async function clearData() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of ['events', 'player_stats', 'standings', 'matches', 'team_players', 'players', 'teams', 'notifications']) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }
    await conn.query('DELETE FROM tournaments');
    await conn.query('ALTER TABLE tournaments AUTO_INCREMENT = 1');
    // cricket + football only
    await conn.query(`DELETE FROM sports WHERE code = 'BASKETBALL'`);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally { conn.release(); }
}

async function makeLeague(name: string, sportId: number, location: string, teams: string[], positions: string[]) {
  const [t]: any = await pool.query(
    `INSERT INTO tournaments (name, sport_id, format, status, location, start_date, end_date)
     VALUES (:name, :sportId, 'ROUND_ROBIN', 'ONGOING', :location, '2026-03-01', '2026-05-30')`,
    { name, sportId, location });
  const tid = t.insertId;
  const built: { id: number; name: string; players: { id: number; name: string; pos: string }[] }[] = [];
  for (const teamName of teams) {
    const [tm]: any = await pool.query(
      `INSERT INTO teams (tournament_id, name, coach, captain, logo_url) VALUES (:tid, :name, :coach, :captain, :logo)`,
      { tid, name: teamName, coach: nextName(), captain: nextName(), logo: teamLogo(teamName) });
    const players: any[] = [];
    for (let i = 0; i < positions.length; i++) {
      const pname = nextName();
      const [pl]: any = await pool.query(
        `INSERT INTO players (team_id, name, jersey_number, position, age, photo_url)
         VALUES (:team, :name, :no, :pos, :age, :photo)`,
        { team: tm.insertId, name: pname, no: i + 1, pos: positions[i], age: 18 + (i % 7), photo: avatar(pname) });
      players.push({ id: pl.insertId, name: pname, pos: positions[i] });
    }
    built.push({ id: tm.insertId, name: teamName, players });
  }
  return { tid, teams: built };
}

async function completeMatch(matchId: number, hs: number, as: number, winnerId: number | null) {
  await pool.query(`UPDATE matches SET home_score=:hs, away_score=:as, status='COMPLETED', winner_team_id=:w WHERE id=:id`,
    { hs, as, w: winnerId, id: matchId });
}

// ---- build a realistic LIVE cricket state (mid 2nd innings chase) ----
function liveCricketState(home: any, away: any, oversLimit = 6) {
  const bat = away; // away chasing
  const bowl = home;
  const batsmen = bat.players.map((p: any, i: number) => ({
    id: p.id, name: p.name, runs: i === 0 ? 34 : i === 1 ? 21 : 0,
    balls: i === 0 ? 19 : i === 1 ? 14 : 0, fours: i === 0 ? 4 : 2, sixes: i === 0 ? 1 : 0,
    out: i < 2 ? false : i < 4, dismissal: i >= 2 && i < 4 ? 'b ' + bowl.players[5]?.name : null,
    onCrease: i < 2,
  }));
  const bowler = bowl.players.find((p: any) => /Bowler/.test(p.pos)) ?? bowl.players[5];
  return {
    sport: 'CRICKET', status: 'live', oversLimit, innings: 2, target: 78,
    home: { id: home.id, name: home.name, players: home.players },
    away: { id: away.id, name: away.name, players: away.players },
    battingSideId: bat.id,
    batting: { teamId: bat.id, teamName: bat.name, score: 55, wickets: 2, balls: 33, strikerIdx: 0, nonStrikerIdx: 1, batsmen },
    bowling: { teamId: bowl.id, teamName: bowl.name, players: bowl.players, currentBowlerId: bowler.id,
      figures: { [bowler.id]: { id: bowler.id, name: bowler.name, balls: 18, runs: 24, wickets: 1 } } },
    ballsThisOver: 3, oversCompleted: 5, thisOver: ['1', '4', '0'],
    needNewBatsman: false, needNewBowler: false,
    currentRunRate: 10.0, required: 23, requiredRunRate: 7.66,
    firstInnings: { teamId: home.id, teamName: home.name, score: 77, wickets: 7, overs: '6.0',
      batsmen: home.players.map((p: any, i: number) => ({ id: p.id, name: p.name, runs: [28, 19, 12, 8, 4, 3, 1, 0][i] ?? 0, balls: [17, 15, 9, 6, 3, 4, 2, 0][i] ?? 0, fours: i < 3 ? 2 : 0, sixes: i === 0 ? 1 : 0, out: i < 7, dismissal: i < 7 ? 'out' : null, onCrease: false })),
      bowlers: bat.players.filter((p: any) => /Bowler|All-rounder/.test(p.pos)).slice(0, 3).map((p: any, i: number) => ({ id: p.id, name: p.name, balls: 12, runs: [22, 28, 27][i], wickets: [3, 2, 2][i] })) },
    secondInnings: null,
    commentary: [
      { t: '5.4 — FOUR! crunched through the covers.', at: Date.now() },
      { t: '5.3 — 1 run, pushed to long-on.', at: Date.now() - 5000 },
      { t: 'Chasing 78 — needs 23 off 15 balls.', at: Date.now() - 9000 },
    ],
  };
}

function liveFootballState(home: any, away: any) {
  return {
    sport: 'FOOTBALL', status: 'live', minute: 63,
    home: { id: home.id, name: home.name, score: 2 },
    away: { id: away.id, name: away.name, score: 1 },
    scorers: [
      { minute: 14, team: home.name, player: home.players[6].name },
      { minute: 39, team: away.name, player: away.players[7].name },
      { minute: 58, team: home.name, player: home.players[7].name },
    ],
    assists: [{ minute: 58, team: home.name, player: home.players[4].name }],
    cards: [{ minute: 47, team: away.name, player: away.players[2].name, type: 'YELLOW' }],
    shots: { home: 9, away: 5 }, possession: { home: 57, away: 43 },
    commentary: [
      { t: "⚽ 58' GOAL! Sharp finish, UCP roars. 2-1.", at: Date.now() },
      { t: "🟨 47' Yellow card for a late challenge.", at: Date.now() - 8000 },
      { t: "⚽ 39' Equaliser against the run of play.", at: Date.now() - 16000 },
    ],
  };
}

async function run() {
  console.log('\n🎓 Seeding UCP Gujranwala demo data\n');
  // admin
  const pw = await hashPassword('Admin@123');
  await pool.query(`INSERT INTO users (full_name,email,password_hash,role_id) VALUES ('UCP Admin','admin@sportsleague.dev',:pw,1)
    ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`, { pw });

  await clearData();
  const [sports]: any = await pool.query(`SELECT id, code FROM sports`);
  const cricketId = sports.find((s: any) => s.code === 'CRICKET').id;
  const footballId = sports.find((s: any) => s.code === 'FOOTBALL').id;

  // ---- Cricket league ----
  const cricket = await makeLeague('UCP Gujranwala Cricket League 2026', cricketId, 'UCP Gujranwala Ground', CRICKET_TEAMS, CR_POS);
  await pool.query(`CALL sp_generate_round_robin(:id)`, { id: cricket.tid });
  const [crMatches]: any = await pool.query(`SELECT id, home_team_id, away_team_id FROM matches WHERE tournament_id=:id ORDER BY id`, { id: cricket.tid });
  // finish a few
  await completeMatch(crMatches[0].id, 142, 138, crMatches[0].home_team_id);
  await completeMatch(crMatches[1].id, 96, 121, crMatches[1].away_team_id);
  await completeMatch(crMatches[2].id, 154, 150, crMatches[2].home_team_id);
  // one LIVE with full scorecard
  const liveCr = crMatches[3];
  const h = cricket.teams.find((t) => t.id === liveCr.home_team_id)!;
  const a = cricket.teams.find((t) => t.id === liveCr.away_team_id)!;
  const crState = liveCricketState(h, a);
  await pool.query(`UPDATE matches SET status='LIVE', home_score=77, away_score=55, home_wickets=7, away_wickets=2, summary_json=:s WHERE id=:id`,
    { s: JSON.stringify(crState), id: liveCr.id });

  // ---- Football league ----
  const football = await makeLeague('UCP Gujranwala Football League 2026', footballId, 'UCP Gujranwala Football Field', FOOTBALL_TEAMS, FB_POS);
  await pool.query(`CALL sp_generate_round_robin(:id)`, { id: football.tid });
  const [fbMatches]: any = await pool.query(`SELECT id, home_team_id, away_team_id FROM matches WHERE tournament_id=:id ORDER BY id`, { id: football.tid });
  await completeMatch(fbMatches[0].id, 3, 1, fbMatches[0].home_team_id);
  await completeMatch(fbMatches[1].id, 0, 2, fbMatches[1].away_team_id);
  await completeMatch(fbMatches[2].id, 1, 1, null);
  const liveFb = fbMatches[3];
  const fh = football.teams.find((t) => t.id === liveFb.home_team_id)!;
  const fa = football.teams.find((t) => t.id === liveFb.away_team_id)!;
  const fbState = liveFootballState(fh, fa);
  await pool.query(`UPDATE matches SET status='LIVE', home_score=2, away_score=1, summary_json=:s WHERE id=:id`,
    { s: JSON.stringify(fbState), id: liveFb.id });

  // rebuild standings from completed matches
  await pool.query(`CALL sp_recalculate_standings(:id)`, { id: cricket.tid });
  await pool.query(`CALL sp_recalculate_standings(:id)`, { id: football.tid });

  // seed some player_stats so leaderboards have data
  for (const lg of [cricket, football]) {
    for (const tm of lg.teams) {
      for (const p of tm.players) {
        const isCricket = lg === cricket;
        await pool.query(
          `INSERT INTO player_stats (tournament_id, player_id, runs, wickets, goals, assists, points)
           VALUES (:tid, :pid, :runs, :wkts, :goals, :assists, 0)
           ON DUPLICATE KEY UPDATE runs=VALUES(runs)`,
          { tid: lg.tid, pid: p.id,
            runs: isCricket ? Math.floor(Math.random() * 180) : 0,
            wkts: isCricket && /Bowler|All-rounder/.test(p.pos) ? Math.floor(Math.random() * 12) : 0,
            goals: !isCricket && /Forward|Midfielder/.test(p.pos) ? Math.floor(Math.random() * 8) : 0,
            assists: !isCricket ? Math.floor(Math.random() * 5) : 0 });
      }
    }
  }

  const [[c]]: any = await pool.query(`SELECT
    (SELECT COUNT(*) FROM tournaments) t,(SELECT COUNT(*) FROM teams) tm,
    (SELECT COUNT(*) FROM players) p,(SELECT COUNT(*) FROM matches) m,
    (SELECT COUNT(*) FROM matches WHERE status='LIVE') live`);
  console.log(`✅ Done — ${c.t} leagues, ${c.tm} teams, ${c.p} players, ${c.m} matches (${c.live} live)`);
  console.log('   Login: admin@sportsleague.dev / Admin@123\n');
  await pool.end();
}

run().catch(async (e) => { console.error('✗ UCP seed failed:', e.message); await pool.end(); process.exit(1); });
