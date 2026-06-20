-- ============================================================================
-- VIEWS  -- aggregation-heavy read models used by the API
-- ============================================================================
USE sportsleague;

DROP VIEW IF EXISTS vw_tournament_summary;
DROP VIEW IF EXISTS vw_team_statistics;
DROP VIEW IF EXISTS vw_top_players;
DROP VIEW IF EXISTS vw_live_matches;

-- Tournament summary: counts of teams / matches / completed, with sport label
CREATE VIEW vw_tournament_summary AS
SELECT
  t.id,
  t.name,
  s.name              AS sport,
  s.code              AS sport_code,
  t.format,
  t.status,
  t.location,
  t.start_date,
  t.end_date,
  COUNT(DISTINCT tm.id)                                          AS team_count,
  COUNT(DISTINCT m.id)                                           AS match_count,
  COUNT(DISTINCT CASE WHEN m.status='COMPLETED' THEN m.id END)   AS completed_count,
  COUNT(DISTINCT CASE WHEN m.status='LIVE' THEN m.id END)        AS live_count
FROM tournaments t
JOIN sports s        ON s.id = t.sport_id
LEFT JOIN teams tm   ON tm.tournament_id = t.id
LEFT JOIN matches m  ON m.tournament_id = t.id
GROUP BY t.id, t.name, s.name, s.code, t.format, t.status, t.location, t.start_date, t.end_date;

-- Team statistics: standings joined with roster size
CREATE VIEW vw_team_statistics AS
SELECT
  st.tournament_id,
  st.team_id,
  tm.name             AS team_name,
  tm.logo_url,
  st.played, st.wins, st.draws, st.losses,
  st.goals_for, st.goals_against, st.goal_diff, st.points,
  (SELECT COUNT(*) FROM players p WHERE p.team_id = tm.id) AS squad_size
FROM standings st
JOIN teams tm ON tm.id = st.team_id;

-- Top players: flattened leaderboard across metrics
CREATE VIEW vw_top_players AS
SELECT
  ps.tournament_id,
  ps.player_id,
  p.name              AS player_name,
  p.photo_url,
  tm.id               AS team_id,
  tm.name             AS team_name,
  ps.goals, ps.assists, ps.yellow_cards, ps.red_cards,
  ps.points, ps.fouls, ps.runs, ps.wickets
FROM player_stats ps
JOIN players p ON p.id = ps.player_id
JOIN teams   tm ON tm.id = p.team_id;

-- Live matches: enriched with team names for public scoreboard
CREATE VIEW vw_live_matches AS
SELECT
  m.id,
  m.tournament_id,
  t.name              AS tournament_name,
  s.code              AS sport_code,
  s.score_label,
  m.status,
  m.round_no,
  m.bracket_stage,
  m.scheduled_at,
  m.venue,
  m.minute_clock,
  ht.id   AS home_team_id, ht.name AS home_team, ht.logo_url AS home_logo,
  at.id   AS away_team_id, at.name AS away_team, at.logo_url AS away_logo,
  m.home_score, m.away_score,
  m.home_wickets, m.away_wickets, m.home_overs, m.away_overs
FROM matches m
JOIN tournaments t ON t.id = m.tournament_id
JOIN sports s      ON s.id = t.sport_id
LEFT JOIN teams ht ON ht.id = m.home_team_id
LEFT JOIN teams at ON at.id = m.away_team_id;
