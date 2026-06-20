-- ============================================================================
-- SEED  -- lookups + a demo football tournament (proves triggers fire)
-- The admin user + bulk Faker data are created by backend/scripts/seed.ts
-- ============================================================================
USE sportsleague;

-- Roles (RBAC)
INSERT INTO roles (id, name, description) VALUES
  (1, 'SUPER_ADMIN',      'Full platform control'),
  (2, 'TOURNAMENT_ADMIN', 'Manage tournaments, teams, players, fixtures'),
  (3, 'MATCH_OFFICIAL',   'Update live scores and events'),
  (4, 'PUBLIC_VIEWER',    'Read-only public access')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sports (extensible — add rows to support more sports)
INSERT INTO sports (id, code, name, score_label) VALUES
  (1, 'FOOTBALL',   'Football',   'Goals'),
  (2, 'CRICKET',    'Cricket',    'Runs'),
  (3, 'BASKETBALL', 'Basketball', 'Points')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---- Demo tournament -------------------------------------------------------
INSERT INTO tournaments (id, name, sport_id, format, status, location, start_date, end_date)
VALUES (1, 'University Football Cup 2026', 1, 'ROUND_ROBIN', 'ONGOING', 'Main Campus', '2026-06-01', '2026-06-30')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, coach, captain, contact) VALUES
  (1, 1, 'Engineering FC',  'A. Khan',   'Bilal',  '0300-1111111'),
  (2, 1, 'Science United',  'R. Ahmed',  'Hamza',  '0300-2222222'),
  (3, 1, 'Arts Rovers',     'S. Malik',  'Usman',  '0300-3333333'),
  (4, 1, 'Business City',   'T. Nawaz',  'Zain',   '0300-4444444')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO players (id, team_id, name, jersey_number, position, age) VALUES
  (1, 1, 'Bilal Raza',    10, 'Forward',    21),
  (2, 1, 'Ahsan Iqbal',    7, 'Midfielder', 22),
  (3, 2, 'Hamza Tariq',    9, 'Forward',    20),
  (4, 2, 'Faraz Ali',      4, 'Defender',   23),
  (5, 3, 'Usman Sheikh',  11, 'Forward',    21),
  (6, 4, 'Zain Abbas',     8, 'Midfielder', 22)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- A completed match: insert as SCHEDULED, add events, then complete it.
-- This exercises the event + match-completion triggers.
INSERT INTO matches (id, tournament_id, home_team_id, away_team_id, round_no, status, scheduled_at, venue)
VALUES (1, 1, 1, 2, 1, 'SCHEDULED', '2026-06-05 18:00:00', 'Stadium A')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Goals via events (trigger updates score + player_stats)
INSERT INTO events (match_id, team_id, player_id, event_type, value, minute, note) VALUES
  (1, 1, 1, 'GOAL',   1, 23, 'Header'),
  (1, 1, 2, 'ASSIST', 1, 23, NULL),
  (1, 1, 1, 'GOAL',   1, 58, 'Penalty'),
  (1, 2, 3, 'GOAL',   1, 71, 'Counter-attack'),
  (1, 2, 4, 'YELLOW_CARD', 1, 80, 'Late tackle');

-- Complete the match (trigger updates standings: Engineering FC 2-1 Science United)
UPDATE matches SET status = 'COMPLETED', winner_team_id = 1 WHERE id = 1;

INSERT INTO notifications (type, title, body, tournament_id, match_id) VALUES
  ('TOURNAMENT_CREATED', 'University Football Cup 2026 created', 'Round robin · Football', 1, NULL),
  ('MATCH_FINISHED', 'Engineering FC 2 - 1 Science United', 'Full time', 1, 1);
