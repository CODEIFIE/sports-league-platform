# Database Guide

MySQL 8, normalized to **3NF**. Run order matters because of dependencies.

## Load order
```
schema.sql      → tables, FKs, indexes
views.sql       → 4 views
procedures.sql  → 6 stored procedures
triggers.sql    → 5 triggers
seed.sql        → lookups + demo tournament
```
`npm run db:setup` runs them in order (delimiter-aware, no mysql CLI required).

## Tables (14)
`roles`, `users`, `refresh_tokens`, `sports`, `tournaments`, `teams`, `players`,
`team_players` (M:N), `matches`, `events`, `standings`, `player_stats`,
`notifications`, `logs`.

Key design choices:
- **Sport-agnostic**: `sports` lookup + a unified `events.event_type` enum
  (`GOAL/ASSIST/YELLOW_CARD/RED_CARD/POINT/FOUL/RUN/WICKET/OVER`) supports all 3 sports
  in one schema. Add a row to `sports` to extend.
- `matches` doubles as the fixtures table (`SCHEDULED → LIVE → COMPLETED`), with
  `round_no` (round-robin) and `bracket_stage` (knockout).
- Aggregates (`standings`, `player_stats`) are **maintained by triggers** for O(1) reads.

## Views
| View | Purpose |
|---|---|
| `vw_tournament_summary` | counts of teams/matches/completed/live per tournament |
| `vw_team_statistics` | standings + squad size |
| `vw_top_players` | flattened player-stat leaderboard |
| `vw_live_matches` | enriched match rows (team names, logos, sport label) for the scoreboard |

## Stored Procedures
| Procedure | Purpose |
|---|---|
| `sp_generate_round_robin(tid)` | all unique pairings, in a **transaction** (cursor-based) |
| `sp_generate_knockout(tid)` | seeds QUARTER/SEMI/FINAL by team count, handles byes |
| `sp_recalculate_standings(tid)` | full rebuild from completed matches (transaction) |
| `sp_get_top_players(tid, metric, limit)` | ranked leaderboard by chosen metric |
| `sp_match_summary(mid)` | scoreline + chronological events |
| `sp_tournament_statistics(tid)` | headline aggregates |

## Triggers
| Trigger | Fires | Action |
|---|---|---|
| `trg_team_after_insert` | INSERT teams | creates the standings row |
| `trg_tournament_after_insert` | INSERT tournaments | writes audit log |
| `trg_event_after_insert` | INSERT events | updates `player_stats` + live `matches` score, logs |
| `trg_event_after_delete` | DELETE events | reverses the above (corrections) |
| `trg_match_after_update` | UPDATE matches → COMPLETED | updates `standings` (W/D/L, GF/GA, GD, **points**), logs |

## Transactions
Used in the fixture-generation and standings-rebuild procedures (with
`EXIT HANDLER FOR SQLEXCEPTION → ROLLBACK`) and in the backend via
`withTransaction()` (see `backend/src/config/db.ts`).

## Indexes
FKs are indexed; additional composite/sort indexes on
`standings(tournament_id, points DESC)`, `events(player_id, event_type)`,
`matches(status)`, `matches(scheduled_at)`, etc.

## Quick verification (psql-style smoke test)
```sql
CALL sp_generate_round_robin(1);
SELECT * FROM vw_live_matches WHERE tournament_id = 1;
-- complete a match and watch standings change:
UPDATE matches SET home_score=2, away_score=1, status='COMPLETED' WHERE id=<scheduled_id>;
SELECT team_name, played, wins, points FROM vw_team_statistics WHERE tournament_id=1 ORDER BY points DESC;
```
