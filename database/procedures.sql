-- ============================================================================
-- STORED PROCEDURES  (transactions + aggregation)
-- ============================================================================
USE sportsleague;

DROP PROCEDURE IF EXISTS sp_generate_round_robin;
DROP PROCEDURE IF EXISTS sp_generate_knockout;
DROP PROCEDURE IF EXISTS sp_recalculate_standings;
DROP PROCEDURE IF EXISTS sp_get_top_players;
DROP PROCEDURE IF EXISTS sp_match_summary;
DROP PROCEDURE IF EXISTS sp_tournament_statistics;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1) GENERATE FIXTURES — ROUND ROBIN (single round, all unique pairings)
--    Wrapped in a transaction; rolls back on any error.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_generate_round_robin(IN p_tournament_id BIGINT)
BEGIN
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_home BIGINT;
  DECLARE v_away BIGINT;
  DECLARE v_round INT DEFAULT 1;

  DECLARE cur CURSOR FOR
    SELECT a.id AS home_id, b.id AS away_id
    FROM teams a
    JOIN teams b
      ON a.tournament_id = b.tournament_id
     AND a.id < b.id
    WHERE a.tournament_id = p_tournament_id
    ORDER BY a.id, b.id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
    -- clear previously generated, still-scheduled fixtures
    DELETE FROM matches
      WHERE tournament_id = p_tournament_id AND status = 'SCHEDULED';

    OPEN cur;
    read_loop: LOOP
      FETCH cur INTO v_home, v_away;
      IF v_done = 1 THEN LEAVE read_loop; END IF;
      INSERT INTO matches (tournament_id, home_team_id, away_team_id, round_no, bracket_stage, status)
      VALUES (p_tournament_id, v_home, v_away, v_round, 'GROUP', 'SCHEDULED');
      SET v_round = v_round + 1;
    END LOOP;
    CLOSE cur;

    INSERT INTO logs(entity, entity_id, action, detail)
    VALUES ('tournament', p_tournament_id, 'GENERATE_FIXTURES', 'round_robin');
  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 2) GENERATE FIXTURES — KNOCKOUT (seeds first stage based on team count)
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_generate_knockout(IN p_tournament_id BIGINT)
BEGIN
  DECLARE v_count INT;
  DECLARE v_stage VARCHAR(10);
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_home BIGINT;
  DECLARE v_away BIGINT;

  DECLARE cur CURSOR FOR
    SELECT id FROM teams WHERE tournament_id = p_tournament_id ORDER BY id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  SELECT COUNT(*) INTO v_count FROM teams WHERE tournament_id = p_tournament_id;

  SET v_stage = CASE
    WHEN v_count >= 8 THEN 'QUARTER'
    WHEN v_count >= 4 THEN 'SEMI'
    ELSE 'FINAL'
  END;

  START TRANSACTION;
    DELETE FROM matches
      WHERE tournament_id = p_tournament_id AND status = 'SCHEDULED';

    OPEN cur;
    pair_loop: LOOP
      FETCH cur INTO v_home;
      IF v_done = 1 THEN LEAVE pair_loop; END IF;
      FETCH cur INTO v_away;
      IF v_done = 1 THEN
        -- odd team out gets a bye: schedule with NULL opponent
        INSERT INTO matches (tournament_id, home_team_id, away_team_id, bracket_stage, status)
        VALUES (p_tournament_id, v_home, NULL, v_stage, 'SCHEDULED');
        LEAVE pair_loop;
      END IF;
      INSERT INTO matches (tournament_id, home_team_id, away_team_id, bracket_stage, status)
      VALUES (p_tournament_id, v_home, v_away, v_stage, 'SCHEDULED');
    END LOOP;
    CLOSE cur;

    INSERT INTO logs(entity, entity_id, action, detail)
    VALUES ('tournament', p_tournament_id, 'GENERATE_FIXTURES', CONCAT('knockout:', v_stage));
  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 3) RECALCULATE STANDINGS — full rebuild from completed matches
--    (idempotent safety net alongside the incremental triggers)
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_recalculate_standings(IN p_tournament_id BIGINT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
    -- reset rows for every team in the tournament
    DELETE FROM standings WHERE tournament_id = p_tournament_id;
    INSERT INTO standings (tournament_id, team_id)
      SELECT p_tournament_id, id FROM teams WHERE tournament_id = p_tournament_id;

    -- accumulate completed matches into a derived table, apply per side
    UPDATE standings s
    JOIN (
      SELECT team_id,
             SUM(played) played, SUM(wins) wins, SUM(draws) draws, SUM(losses) losses,
             SUM(gf) gf, SUM(ga) ga
      FROM (
        SELECT home_team_id team_id, 1 played,
               (home_score>away_score) wins, (home_score=away_score) draws, (home_score<away_score) losses,
               home_score gf, away_score ga
        FROM matches WHERE tournament_id = p_tournament_id AND status='COMPLETED' AND home_team_id IS NOT NULL
        UNION ALL
        SELECT away_team_id, 1,
               (away_score>home_score), (home_score=away_score), (away_score<home_score),
               away_score, home_score
        FROM matches WHERE tournament_id = p_tournament_id AND status='COMPLETED' AND away_team_id IS NOT NULL
      ) per_side
      GROUP BY team_id
    ) agg ON agg.team_id = s.team_id AND s.tournament_id = p_tournament_id
    SET s.played = agg.played, s.wins = agg.wins, s.draws = agg.draws, s.losses = agg.losses,
        s.goals_for = agg.gf, s.goals_against = agg.ga,
        s.goal_diff = agg.gf - agg.ga,
        s.points = agg.wins*3 + agg.draws*1;
  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 4) GET TOP PLAYERS — ranked by a chosen metric
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_top_players(IN p_tournament_id BIGINT, IN p_metric VARCHAR(20), IN p_limit INT)
BEGIN
  SET p_limit = IFNULL(p_limit, 10);
  SELECT player_id, player_name, photo_url, team_name,
    CASE p_metric
      WHEN 'goals'   THEN goals
      WHEN 'assists' THEN assists
      WHEN 'points'  THEN points
      WHEN 'runs'    THEN runs
      WHEN 'wickets' THEN wickets
      WHEN 'yellow'  THEN yellow_cards
      WHEN 'red'     THEN red_cards
      ELSE goals
    END AS metric_value
  FROM vw_top_players
  WHERE tournament_id = p_tournament_id
  ORDER BY metric_value DESC
  LIMIT p_limit;
END$$

-- ----------------------------------------------------------------------------
-- 5) MATCH SUMMARY — scoreline + chronological events
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_match_summary(IN p_match_id BIGINT)
BEGIN
  SELECT * FROM vw_live_matches WHERE id = p_match_id;
  SELECT e.id, e.event_type, e.value, e.minute, e.note, e.created_at,
         tm.name AS team_name, p.name AS player_name
  FROM events e
  LEFT JOIN teams tm  ON tm.id = e.team_id
  LEFT JOIN players p ON p.id = e.player_id
  WHERE e.match_id = p_match_id
  ORDER BY e.minute, e.id;
END$$

-- ----------------------------------------------------------------------------
-- 6) TOURNAMENT STATISTICS — headline aggregates for dashboards
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_tournament_statistics(IN p_tournament_id BIGINT)
BEGIN
  SELECT
    (SELECT COUNT(*) FROM teams   WHERE tournament_id = p_tournament_id) AS teams,
    (SELECT COUNT(*) FROM players p JOIN teams t ON t.id=p.team_id
       WHERE t.tournament_id = p_tournament_id)                          AS players,
    (SELECT COUNT(*) FROM matches WHERE tournament_id = p_tournament_id) AS matches,
    (SELECT COUNT(*) FROM matches WHERE tournament_id = p_tournament_id AND status='COMPLETED') AS completed,
    (SELECT COUNT(*) FROM matches WHERE tournament_id = p_tournament_id AND status='LIVE')      AS live,
    (SELECT IFNULL(SUM(home_score+away_score),0) FROM matches
       WHERE tournament_id = p_tournament_id AND status='COMPLETED')     AS total_score;
END$$

DELIMITER ;
