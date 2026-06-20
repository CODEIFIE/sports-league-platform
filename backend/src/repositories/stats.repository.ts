import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export const statsRepository = {
  async standings(tournamentId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM vw_team_statistics
        WHERE tournament_id = :tournamentId
        ORDER BY points DESC, goal_diff DESC, goals_for DESC, team_name ASC`,
      { tournamentId },
    );
    return rows;
  },

  async topPlayers(tournamentId: number, metric: string, limit: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `CALL sp_get_top_players(:tournamentId, :metric, :limit)`,
      { tournamentId, metric, limit },
    );
    // CALL returns [resultRows, okPacket]
    return (rows as unknown as RowDataPacket[][])[0];
  },

  async playerStats(tournamentId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM vw_top_players WHERE tournament_id = :tournamentId
        ORDER BY goals DESC, points DESC, runs DESC`,
      { tournamentId },
    );
    return rows;
  },

  // ---- dashboard aggregates ------------------------------------------------
  async dashboardCounts() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM tournaments)                      AS tournaments,
         (SELECT COUNT(*) FROM tournaments WHERE status='ONGOING') AS active_tournaments,
         (SELECT COUNT(*) FROM teams)                            AS teams,
         (SELECT COUNT(*) FROM players)                          AS players,
         (SELECT COUNT(*) FROM matches)                          AS matches,
         (SELECT COUNT(*) FROM matches WHERE status='LIVE')      AS live_matches,
         (SELECT COUNT(*) FROM matches WHERE status='SCHEDULED') AS upcoming_matches`,
    );
    return rows[0];
  },

  async matchesPerTournament() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.name AS label, COUNT(m.id) AS value
         FROM tournaments t LEFT JOIN matches m ON m.tournament_id = t.id
        GROUP BY t.id, t.name ORDER BY value DESC LIMIT 8`,
    );
    return rows;
  },

  async goalsPerTournament() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.name AS label, IFNULL(SUM(m.home_score + m.away_score),0) AS value
         FROM tournaments t LEFT JOIN matches m
           ON m.tournament_id = t.id AND m.status='COMPLETED'
        GROUP BY t.id, t.name ORDER BY value DESC LIMIT 8`,
    );
    return rows;
  },

  async winsDistribution() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         SUM(wins)   AS wins,
         SUM(draws)  AS draws,
         SUM(losses) AS losses
       FROM standings`,
    );
    return rows[0];
  },

  async topTeams() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT tm.name AS label, st.points AS value
         FROM standings st JOIN teams tm ON tm.id = st.team_id
        ORDER BY st.points DESC, st.goal_diff DESC LIMIT 6`,
    );
    return rows;
  },

  /** Man of the Tournament — top performer by a sport-weighted impact score. */
  async mvp(tournamentId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT vp.*,
              (vp.goals*4 + vp.assists*2 + vp.points*0.3 + vp.runs*0.08 + vp.wickets*4
               + vp.yellow_cards*-1 + vp.red_cards*-2) AS impact
         FROM vw_top_players vp
        WHERE vp.tournament_id = :tournamentId
        ORDER BY impact DESC
        LIMIT 1`,
      { tournamentId },
    );
    return rows[0] ?? null;
  },

  async recentActivity() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT entity, action, detail, created_at FROM logs ORDER BY id DESC LIMIT 12`,
    );
    return rows;
  },
};
