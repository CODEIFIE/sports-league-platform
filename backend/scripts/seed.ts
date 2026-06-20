/**
 * Bulk realistic seed data via Faker + the default admin user.
 * Assumes the schema is already loaded (run db:setup first).
 *
 *   npm run db:seed
 */
import { faker } from '@faker-js/faker';
import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

const FOOTBALL_POS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

async function seedUsers() {
  const password = await hashPassword('Admin@123');
  const users: [string, string, number][] = [
    ['Super Admin', 'admin@sportsleague.dev', 1],
    ['Tournament Admin', 'organizer@sportsleague.dev', 2],
    ['Match Official', 'official@sportsleague.dev', 3],
  ];
  for (const [name, email, roleId] of users) {
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id)
       VALUES (:name, :email, :password, :roleId)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
      { name, email, password, roleId },
    );
  }
  console.log('✓ Users seeded (admin@sportsleague.dev / Admin@123)');
}

async function seedTournament(name: string, sportId: number, format: string) {
  const [res]: any = await pool.query(
    `INSERT INTO tournaments (name, sport_id, format, status, location, start_date, end_date)
     VALUES (:name, :sportId, :format, 'ONGOING', :loc, :start, :end)`,
    {
      name, sportId, format,
      loc: faker.location.city(),
      start: '2026-06-01', end: '2026-07-30',
    },
  );
  const tournamentId = res.insertId;

  const teamCount = format === 'KNOCKOUT' ? 8 : 4;
  const teamIds: number[] = [];
  for (let i = 0; i < teamCount; i++) {
    const teamName = `${faker.location.city()} ${faker.helpers.arrayElement(['FC', 'United', 'Rovers', 'City', 'Stars', 'Kings'])}`;
    const [t]: any = await pool.query(
      `INSERT INTO teams (tournament_id, name, coach, captain, contact)
       VALUES (:tournamentId, :name, :coach, :captain, :contact)`,
      {
        tournamentId, name: teamName,
        coach: faker.person.fullName(),
        captain: faker.person.fullName(),
        contact: faker.phone.number(),
      },
    );
    teamIds.push(t.insertId);

    // 7 players per team
    for (let j = 1; j <= 7; j++) {
      await pool.query(
        `INSERT INTO players (team_id, name, jersey_number, position, age)
         VALUES (:teamId, :name, :jersey, :pos, :age)`,
        {
          teamId: t.insertId,
          name: faker.person.fullName(),
          jersey: j,
          pos: faker.helpers.arrayElement(FOOTBALL_POS),
          age: faker.number.int({ min: 18, max: 34 }),
        },
      );
    }
  }

  // generate fixtures via the stored procedure
  if (format === 'ROUND_ROBIN') await pool.query(`CALL sp_generate_round_robin(:id)`, { id: tournamentId });
  else await pool.query(`CALL sp_generate_knockout(:id)`, { id: tournamentId });

  // play out ~60% of matches with random events
  const [matches]: any = await pool.query(
    `SELECT id, home_team_id, away_team_id FROM matches WHERE tournament_id = :id AND status='SCHEDULED'`,
    { id: tournamentId },
  );
  for (const m of matches) {
    if (!m.away_team_id || Math.random() > 0.6) continue;
    const goals = faker.number.int({ min: 0, max: 5 });
    for (let g = 0; g < goals; g++) {
      const scorer = faker.helpers.arrayElement([m.home_team_id, m.away_team_id]);
      const [players]: any = await pool.query(
        `SELECT id FROM players WHERE team_id = :tid ORDER BY RAND() LIMIT 1`, { tid: scorer });
      await pool.query(
        `INSERT INTO events (match_id, team_id, player_id, event_type, value, minute)
         VALUES (:mid, :tid, :pid, 'GOAL', 1, :min)`,
        { mid: m.id, tid: scorer, pid: players[0]?.id ?? null, min: faker.number.int({ min: 1, max: 90 }) },
      );
    }
    await pool.query(`UPDATE matches SET status='COMPLETED' WHERE id = :id`, { id: m.id });
  }

  console.log(`✓ "${name}" — ${teamCount} teams, ${matches.length} fixtures`);
  return tournamentId;
}

async function run() {
  await seedUsers();
  await seedTournament('Premier Football League 2026', 1, 'ROUND_ROBIN');
  await seedTournament('City Cricket Championship', 2, 'ROUND_ROBIN');
  await seedTournament('Pro Basketball Knockout', 3, 'KNOCKOUT');
  console.log('\n✓ Seed complete.');
  await pool.end();
}

run().catch(async (err) => {
  console.error('✗ Seed failed:', err.message);
  await pool.end();
  process.exit(1);
});
