/**
 * End-to-end database smoke test — proves triggers, stored procedures, and
 * views work against a live MySQL. Run AFTER `npm run db:setup`.
 *
 *   npm run test:db
 *
 * Creates an isolated "Smoke Test" tournament, exercises the pipeline, asserts
 * the trigger/procedure side effects, then cleans up after itself.
 */
import { pool } from '../src/config/db.js';

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}  ${detail}`); }
}

async function q<T = any>(sql: string, params?: Record<string, any>): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

async function run() {
  console.log('\n🧪 Database smoke test\n');

  // ---- clean any prior run -------------------------------------------------
  await pool.query(`DELETE FROM tournaments WHERE name = 'Smoke Test Cup'`);

  // ---- create tournament (trigger: audit log) ------------------------------
  const [tIns]: any = await pool.query(
    `INSERT INTO tournaments (name, sport_id, format, status) VALUES ('Smoke Test Cup', 1, 'ROUND_ROBIN', 'ONGOING')`,
  );
  const tid = tIns.insertId;
  const logs = await q(`SELECT * FROM logs WHERE entity='tournament' AND entity_id=:tid AND action='CREATE'`, { tid });
  check('trg_tournament_after_insert writes a log', logs.length === 1);

  // ---- create teams (trigger: standings rows auto-created) ------------------
  const teamIds: number[] = [];
  for (const name of ['Alpha', 'Bravo', 'Charlie', 'Delta']) {
    const [r]: any = await pool.query(
      `INSERT INTO teams (tournament_id, name) VALUES (:tid, :name)`, { tid, name });
    teamIds.push(r.insertId);
  }
  const standCount = await q(`SELECT COUNT(*) AS n FROM standings WHERE tournament_id=:tid`, { tid });
  check('trg_team_after_insert creates a standings row per team', Number(standCount[0].n) === 4,
    `got ${standCount[0].n}`);

  // ---- players -------------------------------------------------------------
  const [pr]: any = await pool.query(
    `INSERT INTO players (team_id, name, jersey_number) VALUES (:t, 'Scorer', 10)`, { t: teamIds[0] });
  const playerId = pr.insertId;

  // ---- stored procedure: round robin fixtures ------------------------------
  await pool.query(`CALL sp_generate_round_robin(:tid)`, { tid });
  const fixtures = await q(`SELECT * FROM matches WHERE tournament_id=:tid`, { tid });
  check('sp_generate_round_robin creates C(4,2)=6 fixtures', fixtures.length === 6,
    `got ${fixtures.length}`);

  // ---- pick a fixture where Alpha is home ----------------------------------
  const match = fixtures.find((m: any) => m.home_team_id === teamIds[0] && m.away_team_id === teamIds[1])
    ?? fixtures[0];

  // ---- event insert (trigger: score + player_stats) ------------------------
  await pool.query(
    `INSERT INTO events (match_id, team_id, player_id, event_type, value, minute)
     VALUES (:m, :t, :p, 'GOAL', 1, 12)`,
    { m: match.id, t: match.home_team_id, p: playerId });
  const afterGoal = await q(`SELECT home_score FROM matches WHERE id=:m`, { m: match.id });
  check('trg_event_after_insert increments match score', Number(afterGoal[0].home_score) === 1,
    `home_score=${afterGoal[0].home_score}`);
  const pstats = await q(`SELECT goals FROM player_stats WHERE tournament_id=:tid AND player_id=:p`, { tid, p: playerId });
  check('trg_event_after_insert updates player_stats.goals', Number(pstats[0]?.goals) === 1,
    `goals=${pstats[0]?.goals}`);

  // ---- complete match (trigger: standings points) --------------------------
  await pool.query(`UPDATE matches SET status='COMPLETED' WHERE id=:m`, { m: match.id });
  const homeStand = await q(
    `SELECT played, wins, points, goals_for FROM standings WHERE tournament_id=:tid AND team_id=:t`,
    { tid, t: match.home_team_id });
  check('trg_match_after_update sets played=1', Number(homeStand[0].played) === 1);
  check('trg_match_after_update awards 3 points for a win', Number(homeStand[0].points) === 3,
    `points=${homeStand[0].points}`);
  check('standings goals_for reflects the goal', Number(homeStand[0].goals_for) === 1);

  // ---- event delete (trigger: reverses) ------------------------------------
  // (re-open is not needed; just verify delete reversal on player_stats)
  const ev = await q(`SELECT id FROM events WHERE match_id=:m`, { m: match.id });
  await pool.query(`DELETE FROM events WHERE id=:e`, { e: ev[0].id });
  const pstats2 = await q(`SELECT goals FROM player_stats WHERE tournament_id=:tid AND player_id=:p`, { tid, p: playerId });
  check('trg_event_after_delete reverses player_stats.goals', Number(pstats2[0]?.goals) === 0,
    `goals=${pstats2[0]?.goals}`);

  // ---- views ---------------------------------------------------------------
  const summary = await q(`SELECT * FROM vw_tournament_summary WHERE id=:tid`, { tid });
  check('vw_tournament_summary returns the tournament', summary.length === 1 && Number(summary[0].team_count) === 4);
  const live = await q(`SELECT * FROM vw_live_matches WHERE tournament_id=:tid`, { tid });
  check('vw_live_matches joins team names', live.length === 6 && !!live[0].home_team);

  // ---- procedures returning result sets ------------------------------------
  const [top]: any = await pool.query(`CALL sp_get_top_players(:tid, 'goals', 5)`, { tid });
  check('sp_get_top_players executes', Array.isArray(top));
  const [statsRows]: any = await pool.query(`CALL sp_tournament_statistics(:tid)`, { tid });
  const statRow = Array.isArray(statsRows?.[0]) ? statsRows[0][0] : statsRows?.[0];
  check('sp_tournament_statistics returns aggregates', Number(statRow?.teams) === 4,
    `teams=${statRow?.teams}`);

  // ---- cleanup -------------------------------------------------------------
  await pool.query(`DELETE FROM tournaments WHERE id=:tid`, { tid });

  console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error('✗ Smoke test crashed:', err.message);
  await pool.end();
  process.exit(1);
});
