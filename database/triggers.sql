-- ============================================================================
-- TRIGGERS  -- auto-update standings, player stats, logs, and points
-- ============================================================================
USE sportsleague;

DROP TRIGGER IF EXISTS trg_event_after_insert;
DROP TRIGGER IF EXISTS trg_event_after_delete;
DROP TRIGGER IF EXISTS trg_match_after_update;
DROP TRIGGER IF EXISTS trg_team_after_insert;
DROP TRIGGER IF EXISTS trg_tournament_after_insert;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- When a team is created, ensure it has a standings row.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_team_after_insert
AFTER INSERT ON teams
FOR EACH ROW
BEGIN
  INSERT INTO standings (tournament_id, team_id)
  VALUES (NEW.tournament_id, NEW.id)
  ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
END$$

-- ----------------------------------------------------------------------------
-- Audit log when a tournament is created.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_tournament_after_insert
AFTER INSERT ON tournaments
FOR EACH ROW
BEGIN
  INSERT INTO logs(entity, entity_id, action, detail)
  VALUES ('tournament', NEW.id, 'CREATE', NEW.name);
END$$

-- ----------------------------------------------------------------------------
-- EVENT INSERTED -> update player_stats (per tournament) + live match score,
-- and write an audit log.  Keeps aggregates in sync in real time.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_event_after_insert
AFTER INSERT ON events
FOR EACH ROW
BEGIN
  DECLARE v_tid BIGINT;

  -- resolve tournament for the match
  SELECT tournament_id INTO v_tid FROM matches WHERE id = NEW.match_id;

  -- ensure a player_stats row exists, then increment the right column
  IF NEW.player_id IS NOT NULL THEN
    INSERT INTO player_stats (tournament_id, player_id)
    VALUES (v_tid, NEW.player_id)
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

    UPDATE player_stats
    SET goals        = goals        + IF(NEW.event_type='GOAL', NEW.value, 0),
        assists      = assists      + IF(NEW.event_type='ASSIST', NEW.value, 0),
        yellow_cards = yellow_cards + IF(NEW.event_type='YELLOW_CARD', 1, 0),
        red_cards    = red_cards    + IF(NEW.event_type='RED_CARD', 1, 0),
        points       = points       + IF(NEW.event_type='POINT', NEW.value, 0),
        fouls        = fouls        + IF(NEW.event_type='FOUL', 1, 0),
        runs         = runs         + IF(NEW.event_type='RUN', NEW.value, 0),
        wickets      = wickets      + IF(NEW.event_type='WICKET', NEW.value, 0)
    WHERE tournament_id = v_tid AND player_id = NEW.player_id;
  END IF;

  -- live scoreline: GOAL/POINT/RUN add to the scoring team; WICKET tracks wickets
  IF NEW.team_id IS NOT NULL THEN
    IF NEW.event_type IN ('GOAL','POINT','RUN') THEN
      UPDATE matches
      SET home_score = home_score + IF(NEW.team_id = home_team_id, NEW.value, 0),
          away_score = away_score + IF(NEW.team_id = away_team_id, NEW.value, 0)
      WHERE id = NEW.match_id;
    ELSEIF NEW.event_type = 'WICKET' THEN
      UPDATE matches
      SET home_wickets = IFNULL(home_wickets,0) + IF(NEW.team_id = away_team_id, NEW.value, 0),
          away_wickets = IFNULL(away_wickets,0) + IF(NEW.team_id = home_team_id, NEW.value, 0)
      WHERE id = NEW.match_id;
    END IF;
  END IF;

  INSERT INTO logs(entity, entity_id, action, detail)
  VALUES ('event', NEW.id, NEW.event_type, CONCAT('match:', NEW.match_id));
END$$

-- ----------------------------------------------------------------------------
-- EVENT DELETED -> reverse the player_stats and scoreline increments.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_event_after_delete
AFTER DELETE ON events
FOR EACH ROW
BEGIN
  DECLARE v_tid BIGINT;
  SELECT tournament_id INTO v_tid FROM matches WHERE id = OLD.match_id;

  IF OLD.player_id IS NOT NULL THEN
    UPDATE player_stats
    SET goals        = GREATEST(0, goals        - IF(OLD.event_type='GOAL', OLD.value, 0)),
        assists      = GREATEST(0, assists      - IF(OLD.event_type='ASSIST', OLD.value, 0)),
        yellow_cards = GREATEST(0, yellow_cards - IF(OLD.event_type='YELLOW_CARD', 1, 0)),
        red_cards    = GREATEST(0, red_cards    - IF(OLD.event_type='RED_CARD', 1, 0)),
        points       = GREATEST(0, points       - IF(OLD.event_type='POINT', OLD.value, 0)),
        fouls        = GREATEST(0, fouls        - IF(OLD.event_type='FOUL', 1, 0)),
        runs         = GREATEST(0, runs         - IF(OLD.event_type='RUN', OLD.value, 0)),
        wickets      = GREATEST(0, wickets      - IF(OLD.event_type='WICKET', OLD.value, 0))
    WHERE tournament_id = v_tid AND player_id = OLD.player_id;
  END IF;

  IF OLD.team_id IS NOT NULL AND OLD.event_type IN ('GOAL','POINT','RUN') THEN
    UPDATE matches
    SET home_score = GREATEST(0, home_score - IF(OLD.team_id = home_team_id, OLD.value, 0)),
        away_score = GREATEST(0, away_score - IF(OLD.team_id = away_team_id, OLD.value, 0))
    WHERE id = OLD.match_id;
  END IF;
END$$

-- ----------------------------------------------------------------------------
-- MATCH COMPLETED -> compute winner, update standings incrementally, log it.
-- Fires only on the SCHEDULED/LIVE -> COMPLETED transition.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_match_after_update
AFTER UPDATE ON matches
FOR EACH ROW
BEGIN
  DECLARE v_home_pts INT DEFAULT 0;
  DECLARE v_away_pts INT DEFAULT 0;

  IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED'
     AND NEW.home_team_id IS NOT NULL AND NEW.away_team_id IS NOT NULL THEN

    -- points: win=3 draw=1 loss=0
    IF NEW.home_score > NEW.away_score THEN SET v_home_pts = 3;
    ELSEIF NEW.home_score < NEW.away_score THEN SET v_away_pts = 3;
    ELSE SET v_home_pts = 1; SET v_away_pts = 1;
    END IF;

    -- ensure rows exist
    INSERT INTO standings (tournament_id, team_id) VALUES (NEW.tournament_id, NEW.home_team_id)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
    INSERT INTO standings (tournament_id, team_id) VALUES (NEW.tournament_id, NEW.away_team_id)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

    -- HOME side
    UPDATE standings
    SET played = played + 1,
        wins   = wins   + IF(NEW.home_score > NEW.away_score, 1, 0),
        draws  = draws  + IF(NEW.home_score = NEW.away_score, 1, 0),
        losses = losses + IF(NEW.home_score < NEW.away_score, 1, 0),
        goals_for     = goals_for + NEW.home_score,
        goals_against = goals_against + NEW.away_score,
        goal_diff     = goal_diff + (NEW.home_score - NEW.away_score),
        points        = points + v_home_pts
    WHERE tournament_id = NEW.tournament_id AND team_id = NEW.home_team_id;

    -- AWAY side
    UPDATE standings
    SET played = played + 1,
        wins   = wins   + IF(NEW.away_score > NEW.home_score, 1, 0),
        draws  = draws  + IF(NEW.away_score = NEW.home_score, 1, 0),
        losses = losses + IF(NEW.away_score < NEW.home_score, 1, 0),
        goals_for     = goals_for + NEW.away_score,
        goals_against = goals_against + NEW.home_score,
        goal_diff     = goal_diff + (NEW.away_score - NEW.home_score),
        points        = points + v_away_pts
    WHERE tournament_id = NEW.tournament_id AND team_id = NEW.away_team_id;

    INSERT INTO logs(entity, entity_id, action, detail)
    VALUES ('match', NEW.id, 'COMPLETED',
            CONCAT(NEW.home_score, '-', NEW.away_score));
  END IF;
END$$

DELIMITER ;
