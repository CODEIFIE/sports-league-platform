-- ============================================================================
-- Sports League Management & Live Scoring Platform
-- SCHEMA  (MySQL 8.0)  --  Normalized to 3NF, with FKs and indexes
-- ============================================================================
-- Run order: schema.sql -> views.sql -> procedures.sql -> triggers.sql -> seed.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sportsleague
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sportsleague;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS standings;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS team_players;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS sports;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- ROLES  (lookup) — RBAC source of truth
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
  id          TINYINT UNSIGNED PRIMARY KEY,
  name        VARCHAR(40)  NOT NULL UNIQUE,
  description VARCHAR(160) NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id       TINYINT UNSIGNED NOT NULL,
  avatar_url    VARCHAR(255) NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;
CREATE INDEX idx_users_role ON users(role_id);

-- ----------------------------------------------------------------------------
-- REFRESH TOKENS  (rotating JWT refresh)
-- ----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,            -- sha256 of the refresh token
  expires_at DATETIME NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_rt_hash UNIQUE (token_hash)
) ENGINE=InnoDB;
CREATE INDEX idx_rt_user ON refresh_tokens(user_id, revoked);

-- ----------------------------------------------------------------------------
-- SPORTS  (lookup) — keeps schema sport-agnostic / extensible
-- ----------------------------------------------------------------------------
CREATE TABLE sports (
  id        TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code      VARCHAR(20)  NOT NULL UNIQUE,   -- FOOTBALL | CRICKET | BASKETBALL
  name      VARCHAR(60)  NOT NULL,
  -- scoring metric label used by the UI (e.g. Goals / Runs / Points)
  score_label VARCHAR(20) NOT NULL DEFAULT 'Points'
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- TOURNAMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE tournaments (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(140) NOT NULL,
  sport_id    TINYINT UNSIGNED NOT NULL,
  format      ENUM('ROUND_ROBIN','KNOCKOUT') NOT NULL DEFAULT 'ROUND_ROBIN',
  status      ENUM('DRAFT','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  location    VARCHAR(160) NULL,
  start_date  DATE NULL,
  end_date    DATE NULL,
  created_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tournaments_sport FOREIGN KEY (sport_id) REFERENCES sports(id),
  CONSTRAINT fk_tournaments_user  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE INDEX idx_tournaments_sport  ON tournaments(sport_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);

-- ----------------------------------------------------------------------------
-- TEAMS
-- ----------------------------------------------------------------------------
CREATE TABLE teams (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tournament_id BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(120) NOT NULL,
  logo_url      VARCHAR(255) NULL,
  coach         VARCHAR(120) NULL,
  captain       VARCHAR(120) NULL,
  contact       VARCHAR(40)  NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teams_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT uq_team_per_tournament UNIQUE (tournament_id, name)
) ENGINE=InnoDB;
CREATE INDEX idx_teams_tournament ON teams(tournament_id);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
CREATE TABLE players (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  team_id       BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(120) NOT NULL,
  jersey_number SMALLINT UNSIGNED NULL,
  position      VARCHAR(40) NULL,
  age           TINYINT UNSIGNED NULL,
  photo_url     VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_players_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT uq_jersey_per_team UNIQUE (team_id, jersey_number)
) ENGINE=InnoDB;
CREATE INDEX idx_players_team ON players(team_id);

-- ----------------------------------------------------------------------------
-- TEAM_PLAYERS  (M:N roster history — a player can move teams across seasons)
-- Resolves the many-to-many cleanly; keeps players normalized.
-- ----------------------------------------------------------------------------
CREATE TABLE team_players (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  team_id    BIGINT UNSIGNED NOT NULL,
  player_id  BIGINT UNSIGNED NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at  DATE NULL,
  CONSTRAINT fk_tp_team   FOREIGN KEY (team_id)   REFERENCES teams(id)   ON DELETE CASCADE,
  CONSTRAINT fk_tp_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT uq_team_player UNIQUE (team_id, player_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- MATCHES  (also serves as fixtures: scheduled -> live -> completed)
-- round/bracket fields support both round-robin and knockout.
-- ----------------------------------------------------------------------------
CREATE TABLE matches (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tournament_id BIGINT UNSIGNED NOT NULL,
  home_team_id  BIGINT UNSIGNED NULL,
  away_team_id  BIGINT UNSIGNED NULL,
  round_no      SMALLINT UNSIGNED NULL,            -- round-robin round
  bracket_stage ENUM('GROUP','QUARTER','SEMI','FINAL') NULL, -- knockout
  scheduled_at  DATETIME NULL,
  venue         VARCHAR(160) NULL,
  status        ENUM('SCHEDULED','LIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  home_score    INT NOT NULL DEFAULT 0,
  away_score    INT NOT NULL DEFAULT 0,
  -- cricket-specific lightweight aggregates (nullable for other sports)
  home_wickets  TINYINT NULL,
  away_wickets  TINYINT NULL,
  home_overs    DECIMAL(4,1) NULL,
  away_overs    DECIMAL(4,1) NULL,
  winner_team_id BIGINT UNSIGNED NULL,
  minute_clock  INT NOT NULL DEFAULT 0,            -- live timer (seconds)
  summary_json  LONGTEXT NULL,                     -- full post-match scorecard / report (JSON)
  mom_player_id BIGINT UNSIGNED NULL,              -- man of the match
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_home FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_matches_away FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_matches_winner FOREIGN KEY (winner_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  CONSTRAINT fk_matches_mom FOREIGN KEY (mom_player_id) REFERENCES players(id) ON DELETE SET NULL
  -- note: "home != away" is enforced in the service layer; MySQL 8 disallows a
  -- CHECK on columns that are also FKs with ON DELETE SET NULL.
) ENGINE=InnoDB;
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status     ON matches(status);
CREATE INDEX idx_matches_schedule   ON matches(scheduled_at);

-- ----------------------------------------------------------------------------
-- EVENTS  (atomic scoring events — drives stats & standings via triggers)
-- ----------------------------------------------------------------------------
CREATE TABLE events (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  match_id    BIGINT UNSIGNED NOT NULL,
  team_id     BIGINT UNSIGNED NULL,
  player_id   BIGINT UNSIGNED NULL,
  -- unified event vocabulary across sports
  event_type  ENUM('GOAL','ASSIST','YELLOW_CARD','RED_CARD',
                    'POINT','FOUL',
                    'RUN','WICKET','OVER') NOT NULL,
  value       INT NOT NULL DEFAULT 1,            -- e.g. points/runs scored in this event
  minute      INT NULL,                          -- game minute / over marker
  note        VARCHAR(200) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_match  FOREIGN KEY (match_id)  REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_team   FOREIGN KEY (team_id)   REFERENCES teams(id)   ON DELETE SET NULL,
  CONSTRAINT fk_events_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE INDEX idx_events_match  ON events(match_id);
CREATE INDEX idx_events_player ON events(player_id, event_type);

-- ----------------------------------------------------------------------------
-- STANDINGS  (one row per team per tournament; maintained by triggers)
-- ----------------------------------------------------------------------------
CREATE TABLE standings (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tournament_id BIGINT UNSIGNED NOT NULL,
  team_id       BIGINT UNSIGNED NOT NULL,
  played        INT NOT NULL DEFAULT 0,
  wins          INT NOT NULL DEFAULT 0,
  draws         INT NOT NULL DEFAULT 0,
  losses        INT NOT NULL DEFAULT 0,
  goals_for     INT NOT NULL DEFAULT 0,
  goals_against INT NOT NULL DEFAULT 0,
  goal_diff     INT NOT NULL DEFAULT 0,
  points        INT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_standings_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_standings_team       FOREIGN KEY (team_id)       REFERENCES teams(id)       ON DELETE CASCADE,
  CONSTRAINT uq_standings UNIQUE (tournament_id, team_id)
) ENGINE=InnoDB;
CREATE INDEX idx_standings_tournament ON standings(tournament_id, points DESC);

-- ----------------------------------------------------------------------------
-- PLAYER_STATS  (aggregated per player per tournament; maintained by triggers)
-- ----------------------------------------------------------------------------
CREATE TABLE player_stats (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tournament_id BIGINT UNSIGNED NOT NULL,
  player_id     BIGINT UNSIGNED NOT NULL,
  goals         INT NOT NULL DEFAULT 0,
  assists       INT NOT NULL DEFAULT 0,
  yellow_cards  INT NOT NULL DEFAULT 0,
  red_cards     INT NOT NULL DEFAULT 0,
  points        INT NOT NULL DEFAULT 0,   -- basketball points
  fouls         INT NOT NULL DEFAULT 0,
  runs          INT NOT NULL DEFAULT 0,   -- cricket
  wickets       INT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pstats_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_pstats_player     FOREIGN KEY (player_id)     REFERENCES players(id)     ON DELETE CASCADE,
  CONSTRAINT uq_pstats UNIQUE (tournament_id, player_id)
) ENGINE=InnoDB;
CREATE INDEX idx_pstats_tournament ON player_stats(tournament_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS  (real-time feed; also persisted)
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  type       VARCHAR(40) NOT NULL,      -- MATCH_STARTED | GOAL | MATCH_FINISHED | TOURNAMENT_CREATED ...
  title      VARCHAR(140) NOT NULL,
  body       VARCHAR(255) NULL,
  tournament_id BIGINT UNSIGNED NULL,
  match_id   BIGINT UNSIGNED NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_match      FOREIGN KEY (match_id)      REFERENCES matches(id)      ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- ----------------------------------------------------------------------------
-- LOGS  (audit trail — written by triggers and the app)
-- ----------------------------------------------------------------------------
CREATE TABLE logs (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity     VARCHAR(40) NOT NULL,
  entity_id  BIGINT UNSIGNED NULL,
  action     VARCHAR(40) NOT NULL,
  detail     VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE INDEX idx_logs_entity ON logs(entity, entity_id);
