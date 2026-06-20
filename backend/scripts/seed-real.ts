/**
 * REAL-DATA seed — Pakistan & international teams, real player names and
 * representative tournament statistics across cricket, football, basketball.
 *
 *   npm run db:seed:real
 *
 * ⚠️  Clears existing tournaments/teams/players/matches (keeps users, roles,
 *     sports), then inserts curated real-world data. Stats are representative
 *     tournament-level figures, not official records.
 */
import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

type Sport = 1 | 2 | 3; // 1=FOOTBALL 2=CRICKET 3=BASKETBALL

interface Roster {
  team: string;
  coach: string;
  captain: string;
  players: Array<{
    name: string; no: number; pos: string; age: number;
    // sport-specific representative stats
    goals?: number; assists?: number; yellow?: number; red?: number; // football
    runs?: number; wickets?: number;                                 // cricket
    points?: number; fouls?: number;                                 // basketball
  }>;
}

// ---------------------------------------------------------------------------
// CRICKET — Asia Cup 2026 (round robin)
// ---------------------------------------------------------------------------
const CRICKET: Roster[] = [
  {
    team: 'Pakistan', coach: 'Azhar Mahmood', captain: 'Babar Azam',
    players: [
      { name: 'Babar Azam', no: 56, pos: 'Batsman', age: 31, runs: 412, wickets: 0 },
      { name: 'Mohammad Rizwan', no: 16, pos: 'Wicketkeeper', age: 33, runs: 305, wickets: 0 },
      { name: 'Fakhar Zaman', no: 39, pos: 'Batsman', age: 35, runs: 268, wickets: 1 },
      { name: 'Shaheen Afridi', no: 10, pos: 'Bowler', age: 26, runs: 24, wickets: 14 },
      { name: 'Naseem Shah', no: 71, pos: 'Bowler', age: 23, runs: 11, wickets: 11 },
      { name: 'Haris Rauf', no: 47, pos: 'Bowler', age: 32, runs: 6, wickets: 13 },
      { name: 'Shadab Khan', no: 8, pos: 'All-rounder', age: 27, runs: 142, wickets: 9 },
      { name: 'Mohammad Nawaz', no: 99, pos: 'All-rounder', age: 32, runs: 98, wickets: 7 },
      { name: 'Saud Shakeel', no: 28, pos: 'Batsman', age: 30, runs: 187, wickets: 0 },
      { name: 'Shan Masood', no: 14, pos: 'Batsman', age: 36, runs: 156, wickets: 0 },
      { name: 'Abrar Ahmed', no: 41, pos: 'Bowler', age: 27, runs: 4, wickets: 10 },
    ],
  },
  {
    team: 'India', coach: 'Gautam Gambhir', captain: 'Rohit Sharma',
    players: [
      { name: 'Rohit Sharma', no: 45, pos: 'Batsman', age: 38, runs: 389, wickets: 0 },
      { name: 'Virat Kohli', no: 18, pos: 'Batsman', age: 37, runs: 421, wickets: 0 },
      { name: 'Shubman Gill', no: 77, pos: 'Batsman', age: 26, runs: 298, wickets: 0 },
      { name: 'Jasprit Bumrah', no: 93, pos: 'Bowler', age: 32, runs: 8, wickets: 15 },
      { name: 'Mohammed Shami', no: 11, pos: 'Bowler', age: 35, runs: 12, wickets: 12 },
      { name: 'Hardik Pandya', no: 33, pos: 'All-rounder', age: 32, runs: 178, wickets: 8 },
      { name: 'Ravindra Jadeja', no: 8, pos: 'All-rounder', age: 37, runs: 134, wickets: 9 },
      { name: 'KL Rahul', no: 1, pos: 'Wicketkeeper', age: 34, runs: 245, wickets: 0 },
      { name: 'Suryakumar Yadav', no: 63, pos: 'Batsman', age: 35, runs: 212, wickets: 0 },
      { name: 'Kuldeep Yadav', no: 23, pos: 'Bowler', age: 31, runs: 9, wickets: 11 },
      { name: 'Axar Patel', no: 20, pos: 'All-rounder', age: 32, runs: 87, wickets: 7 },
    ],
  },
  {
    team: 'Sri Lanka', coach: 'Sanath Jayasuriya', captain: 'Charith Asalanka',
    players: [
      { name: 'Pathum Nissanka', no: 36, pos: 'Batsman', age: 27, runs: 276, wickets: 0 },
      { name: 'Kusal Mendis', no: 35, pos: 'Wicketkeeper', age: 31, runs: 254, wickets: 0 },
      { name: 'Charith Asalanka', no: 88, pos: 'Batsman', age: 29, runs: 198, wickets: 2 },
      { name: 'Wanindu Hasaranga', no: 49, pos: 'All-rounder', age: 29, runs: 112, wickets: 13 },
      { name: 'Maheesh Theekshana', no: 61, pos: 'Bowler', age: 26, runs: 7, wickets: 10 },
      { name: 'Dushmantha Chameera', no: 56, pos: 'Bowler', age: 34, runs: 5, wickets: 8 },
      { name: 'Dhananjaya de Silva', no: 73, pos: 'All-rounder', age: 34, runs: 143, wickets: 4 },
      { name: 'Kusal Perera', no: 17, pos: 'Batsman', age: 35, runs: 167, wickets: 0 },
    ],
  },
  {
    team: 'Bangladesh', coach: 'Phil Simmons', captain: 'Najmul Hossain Shanto',
    players: [
      { name: 'Najmul Hossain Shanto', no: 99, pos: 'Batsman', age: 28, runs: 234, wickets: 0 },
      { name: 'Litton Das', no: 16, pos: 'Wicketkeeper', age: 31, runs: 211, wickets: 0 },
      { name: 'Towhid Hridoy', no: 47, pos: 'Batsman', age: 25, runs: 189, wickets: 0 },
      { name: 'Mehidy Hasan Miraz', no: 8, pos: 'All-rounder', age: 28, runs: 121, wickets: 9 },
      { name: 'Taskin Ahmed', no: 3, pos: 'Bowler', age: 31, runs: 8, wickets: 12 },
      { name: 'Mustafizur Rahman', no: 90, pos: 'Bowler', age: 30, runs: 4, wickets: 11 },
      { name: 'Mahmudullah', no: 30, pos: 'All-rounder', age: 40, runs: 98, wickets: 3 },
      { name: 'Tanzid Hasan', no: 31, pos: 'Batsman', age: 25, runs: 145, wickets: 0 },
    ],
  },
  {
    team: 'Afghanistan', coach: 'Jonathan Trott', captain: 'Hashmatullah Shahidi',
    players: [
      { name: 'Rahmanullah Gurbaz', no: 21, pos: 'Wicketkeeper', age: 24, runs: 287, wickets: 0 },
      { name: 'Ibrahim Zadran', no: 5, pos: 'Batsman', age: 24, runs: 312, wickets: 0 },
      { name: 'Hashmatullah Shahidi', no: 1, pos: 'Batsman', age: 31, runs: 176, wickets: 0 },
      { name: 'Rashid Khan', no: 19, pos: 'All-rounder', age: 27, runs: 89, wickets: 16 },
      { name: 'Mohammad Nabi', no: 7, pos: 'All-rounder', age: 41, runs: 134, wickets: 6 },
      { name: 'Mujeeb Ur Rahman', no: 88, pos: 'Bowler', age: 25, runs: 6, wickets: 10 },
      { name: 'Fazalhaq Farooqi', no: 58, pos: 'Bowler', age: 25, runs: 3, wickets: 12 },
      { name: 'Azmatullah Omarzai', no: 44, pos: 'All-rounder', age: 26, runs: 156, wickets: 7 },
    ],
  },
];

// ---------------------------------------------------------------------------
// FOOTBALL — International Champions Cup 2026 (round robin)
// ---------------------------------------------------------------------------
const FOOTBALL: Roster[] = [
  {
    team: 'Argentina', coach: 'Lionel Scaloni', captain: 'Lionel Messi',
    players: [
      { name: 'Lionel Messi', no: 10, pos: 'Forward', age: 38, goals: 7, assists: 5, yellow: 1, red: 0 },
      { name: 'Julián Álvarez', no: 9, pos: 'Forward', age: 26, goals: 5, assists: 2, yellow: 1, red: 0 },
      { name: 'Lautaro Martínez', no: 22, pos: 'Forward', age: 28, goals: 4, assists: 1, yellow: 0, red: 0 },
      { name: 'Enzo Fernández', no: 24, pos: 'Midfielder', age: 25, goals: 2, assists: 4, yellow: 2, red: 0 },
      { name: 'Rodrigo De Paul', no: 7, pos: 'Midfielder', age: 31, goals: 1, assists: 3, yellow: 3, red: 0 },
      { name: 'Alexis Mac Allister', no: 20, pos: 'Midfielder', age: 27, goals: 2, assists: 2, yellow: 1, red: 0 },
      { name: 'Cristian Romero', no: 13, pos: 'Defender', age: 28, goals: 1, assists: 0, yellow: 3, red: 1 },
      { name: 'Nicolás Otamendi', no: 19, pos: 'Defender', age: 38, goals: 0, assists: 0, yellow: 2, red: 0 },
      { name: 'Emiliano Martínez', no: 23, pos: 'Goalkeeper', age: 33, goals: 0, assists: 0, yellow: 1, red: 0 },
    ],
  },
  {
    team: 'France', coach: 'Didier Deschamps', captain: 'Kylian Mbappé',
    players: [
      { name: 'Kylian Mbappé', no: 10, pos: 'Forward', age: 27, goals: 8, assists: 3, yellow: 1, red: 0 },
      { name: 'Ousmane Dembélé', no: 11, pos: 'Forward', age: 28, goals: 3, assists: 4, yellow: 0, red: 0 },
      { name: 'Antoine Griezmann', no: 7, pos: 'Forward', age: 35, goals: 4, assists: 3, yellow: 1, red: 0 },
      { name: 'Aurélien Tchouaméni', no: 8, pos: 'Midfielder', age: 26, goals: 1, assists: 1, yellow: 2, red: 0 },
      { name: 'Eduardo Camavinga', no: 25, pos: 'Midfielder', age: 23, goals: 0, assists: 2, yellow: 2, red: 0 },
      { name: 'William Saliba', no: 17, pos: 'Defender', age: 25, goals: 1, assists: 0, yellow: 1, red: 0 },
      { name: 'Theo Hernández', no: 22, pos: 'Defender', age: 28, goals: 2, assists: 2, yellow: 2, red: 0 },
      { name: 'Dayot Upamecano', no: 4, pos: 'Defender', age: 27, goals: 0, assists: 0, yellow: 3, red: 0 },
      { name: 'Mike Maignan', no: 16, pos: 'Goalkeeper', age: 30, goals: 0, assists: 0, yellow: 0, red: 0 },
    ],
  },
  {
    team: 'Brazil', coach: 'Dorival Júnior', captain: 'Marquinhos',
    players: [
      { name: 'Vinícius Júnior', no: 7, pos: 'Forward', age: 26, goals: 6, assists: 4, yellow: 2, red: 0 },
      { name: 'Rodrygo', no: 10, pos: 'Forward', age: 25, goals: 4, assists: 3, yellow: 0, red: 0 },
      { name: 'Raphinha', no: 11, pos: 'Forward', age: 29, goals: 5, assists: 2, yellow: 1, red: 0 },
      { name: 'Bruno Guimarães', no: 8, pos: 'Midfielder', age: 28, goals: 1, assists: 2, yellow: 3, red: 0 },
      { name: 'Casemiro', no: 5, pos: 'Midfielder', age: 34, goals: 0, assists: 1, yellow: 4, red: 1 },
      { name: 'Marquinhos', no: 4, pos: 'Defender', age: 31, goals: 1, assists: 0, yellow: 2, red: 0 },
      { name: 'Éder Militão', no: 3, pos: 'Defender', age: 28, goals: 0, assists: 0, yellow: 1, red: 0 },
      { name: 'Danilo', no: 2, pos: 'Defender', age: 34, goals: 0, assists: 1, yellow: 2, red: 0 },
      { name: 'Alisson Becker', no: 1, pos: 'Goalkeeper', age: 33, goals: 0, assists: 0, yellow: 0, red: 0 },
    ],
  },
  {
    team: 'England', coach: 'Thomas Tuchel', captain: 'Harry Kane',
    players: [
      { name: 'Harry Kane', no: 9, pos: 'Forward', age: 32, goals: 7, assists: 2, yellow: 1, red: 0 },
      { name: 'Jude Bellingham', no: 10, pos: 'Midfielder', age: 22, goals: 5, assists: 4, yellow: 2, red: 0 },
      { name: 'Bukayo Saka', no: 7, pos: 'Forward', age: 24, goals: 4, assists: 3, yellow: 0, red: 0 },
      { name: 'Phil Foden', no: 11, pos: 'Midfielder', age: 25, goals: 3, assists: 3, yellow: 1, red: 0 },
      { name: 'Declan Rice', no: 4, pos: 'Midfielder', age: 27, goals: 1, assists: 2, yellow: 2, red: 0 },
      { name: 'John Stones', no: 5, pos: 'Defender', age: 31, goals: 1, assists: 0, yellow: 1, red: 0 },
      { name: 'Kyle Walker', no: 2, pos: 'Defender', age: 35, goals: 0, assists: 1, yellow: 2, red: 0 },
      { name: 'Marc Guéhi', no: 6, pos: 'Defender', age: 25, goals: 0, assists: 0, yellow: 2, red: 0 },
      { name: 'Jordan Pickford', no: 1, pos: 'Goalkeeper', age: 31, goals: 0, assists: 0, yellow: 0, red: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// BASKETBALL — FIBA World Cup 2026 (knockout, 8 teams)
// ---------------------------------------------------------------------------
const BASKETBALL: Roster[] = [
  {
    team: 'USA', coach: 'Steve Kerr', captain: 'LeBron James',
    players: [
      { name: 'LeBron James', no: 6, pos: 'Forward', age: 41, points: 142, fouls: 8 },
      { name: 'Stephen Curry', no: 30, pos: 'Guard', age: 38, points: 168, fouls: 6 },
      { name: 'Kevin Durant', no: 7, pos: 'Forward', age: 37, points: 155, fouls: 9 },
      { name: 'Anthony Edwards', no: 5, pos: 'Guard', age: 24, points: 134, fouls: 11 },
      { name: 'Jayson Tatum', no: 0, pos: 'Forward', age: 28, points: 128, fouls: 10 },
      { name: 'Devin Booker', no: 1, pos: 'Guard', age: 29, points: 119, fouls: 7 },
    ],
  },
  {
    team: 'Serbia', coach: 'Svetislav Pešić', captain: 'Nikola Jokić',
    players: [
      { name: 'Nikola Jokić', no: 15, pos: 'Center', age: 31, points: 176, fouls: 9 },
      { name: 'Bogdan Bogdanović', no: 7, pos: 'Guard', age: 33, points: 138, fouls: 8 },
      { name: 'Vasilije Micić', no: 22, pos: 'Guard', age: 32, points: 96, fouls: 10 },
      { name: 'Nikola Jović', no: 5, pos: 'Forward', age: 23, points: 84, fouls: 12 },
      { name: 'Filip Petrušev', no: 33, pos: 'Center', age: 26, points: 72, fouls: 11 },
    ],
  },
  {
    team: 'France', coach: 'Frédéric Fauthoux', captain: 'Rudy Gobert',
    players: [
      { name: 'Victor Wembanyama', no: 1, pos: 'Center', age: 22, points: 158, fouls: 13 },
      { name: 'Rudy Gobert', no: 27, pos: 'Center', age: 34, points: 88, fouls: 14 },
      { name: 'Evan Fournier', no: 10, pos: 'Guard', age: 33, points: 102, fouls: 7 },
      { name: 'Guerschon Yabusele', no: 7, pos: 'Forward', age: 30, points: 94, fouls: 10 },
      { name: 'Nicolas Batum', no: 5, pos: 'Forward', age: 37, points: 61, fouls: 8 },
    ],
  },
  {
    team: 'Canada', coach: 'Jordi Fernández', captain: 'Shai Gilgeous-Alexander',
    players: [
      { name: 'Shai Gilgeous-Alexander', no: 2, pos: 'Guard', age: 27, points: 171, fouls: 7 },
      { name: 'Jamal Murray', no: 27, pos: 'Guard', age: 29, points: 124, fouls: 9 },
      { name: 'RJ Barrett', no: 9, pos: 'Forward', age: 25, points: 108, fouls: 10 },
      { name: 'Dillon Brooks', no: 24, pos: 'Forward', age: 30, points: 86, fouls: 13 },
      { name: 'Dwight Powell', no: 33, pos: 'Center', age: 34, points: 54, fouls: 11 },
    ],
  },
  {
    team: 'Spain', coach: 'Sergio Scariolo', captain: 'Willy Hernangómez',
    players: [
      { name: 'Willy Hernangómez', no: 14, pos: 'Center', age: 31, points: 112, fouls: 12 },
      { name: 'Lorenzo Brown', no: 4, pos: 'Guard', age: 35, points: 98, fouls: 8 },
      { name: 'Santi Aldama', no: 7, pos: 'Forward', age: 25, points: 104, fouls: 9 },
      { name: 'Juancho Hernangómez', no: 41, pos: 'Forward', age: 30, points: 76, fouls: 10 },
      { name: 'Darío Brizuela', no: 11, pos: 'Guard', age: 31, points: 68, fouls: 7 },
    ],
  },
  {
    team: 'Germany', coach: 'Álex Mumbrú', captain: 'Dennis Schröder',
    players: [
      { name: 'Dennis Schröder', no: 17, pos: 'Guard', age: 32, points: 146, fouls: 8 },
      { name: 'Franz Wagner', no: 22, pos: 'Forward', age: 24, points: 152, fouls: 9 },
      { name: 'Moritz Wagner', no: 13, pos: 'Center', age: 28, points: 94, fouls: 13 },
      { name: 'Daniel Theis', no: 10, pos: 'Center', age: 33, points: 72, fouls: 12 },
      { name: 'Andreas Obst', no: 7, pos: 'Guard', age: 29, points: 81, fouls: 6 },
    ],
  },
  {
    team: 'Australia', coach: 'Brian Goorjian', captain: 'Patty Mills',
    players: [
      { name: 'Josh Giddey', no: 3, pos: 'Guard', age: 23, points: 118, fouls: 9 },
      { name: 'Patty Mills', no: 5, pos: 'Guard', age: 37, points: 96, fouls: 7 },
      { name: 'Dyson Daniels', no: 11, pos: 'Guard', age: 23, points: 88, fouls: 10 },
      { name: 'Josh Green', no: 8, pos: 'Forward', age: 25, points: 74, fouls: 8 },
      { name: 'Jock Landale', no: 34, pos: 'Center', age: 30, points: 69, fouls: 12 },
    ],
  },
  {
    team: 'Slovenia', coach: 'Aleksander Sekulić', captain: 'Luka Dončić',
    players: [
      { name: 'Luka Dončić', no: 77, pos: 'Guard', age: 27, points: 189, fouls: 10 },
      { name: 'Goran Dragić', no: 11, pos: 'Guard', age: 39, points: 82, fouls: 8 },
      { name: 'Vlatko Čančar', no: 31, pos: 'Forward', age: 29, points: 96, fouls: 11 },
      { name: 'Klemen Prepelič', no: 23, pos: 'Guard', age: 33, points: 78, fouls: 7 },
      { name: 'Edo Murić', no: 30, pos: 'Forward', age: 35, points: 58, fouls: 9 },
    ],
  },
];

async function clearData() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of ['events', 'player_stats', 'standings', 'matches', 'team_players', 'players', 'teams', 'notifications']) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }
    await conn.query('DELETE FROM tournaments');
    await conn.query('ALTER TABLE tournaments AUTO_INCREMENT = 1');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    conn.release();
  }
}

async function seedTournament(name: string, sport: Sport, format: 'ROUND_ROBIN' | 'KNOCKOUT', rosters: Roster[], location: string) {
  const [t]: any = await pool.query(
    `INSERT INTO tournaments (name, sport_id, format, status, location, start_date, end_date)
     VALUES (:name, :sport, :format, 'ONGOING', :location, '2026-06-01', '2026-07-15')`,
    { name, sport, format, location },
  );
  const tid = t.insertId;

  const teamIds: number[] = [];
  for (const r of rosters) {
    const [tm]: any = await pool.query(
      `INSERT INTO teams (tournament_id, name, coach, captain) VALUES (:tid, :name, :coach, :captain)`,
      { tid, name: r.team, coach: r.coach, captain: r.captain },
    );
    teamIds.push(tm.insertId);
    for (const p of r.players) {
      const [pl]: any = await pool.query(
        `INSERT INTO players (team_id, name, jersey_number, position, age)
         VALUES (:team, :name, :no, :pos, :age)`,
        { team: tm.insertId, name: p.name, no: p.no, pos: p.pos, age: p.age },
      );
      // representative stats straight into player_stats (leaderboards)
      await pool.query(
        `INSERT INTO player_stats (tournament_id, player_id, goals, assists, yellow_cards, red_cards, points, fouls, runs, wickets)
         VALUES (:tid, :pid, :goals, :assists, :yellow, :red, :points, :fouls, :runs, :wickets)`,
        {
          tid, pid: pl.insertId,
          goals: p.goals ?? 0, assists: p.assists ?? 0, yellow: p.yellow ?? 0, red: p.red ?? 0,
          points: p.points ?? 0, fouls: p.fouls ?? 0, runs: p.runs ?? 0, wickets: p.wickets ?? 0,
        },
      );
    }
  }

  // fixtures via stored procedures
  if (format === 'ROUND_ROBIN') await pool.query(`CALL sp_generate_round_robin(:tid)`, { tid });
  else await pool.query(`CALL sp_generate_knockout(:tid)`, { tid });

  return { tid, teamIds, rosters };
}

/** Complete a set of matches with realistic scorelines so standings populate via trigger. */
async function playMatches(tid: number, results: Array<[home: string, away: string, hs: number, as: number]>, rosters: Roster[]) {
  const [matches]: any = await pool.query(
    `SELECT m.id, ht.name AS home, at.name AS away
       FROM matches m JOIN teams ht ON ht.id=m.home_team_id JOIN teams at ON at.id=m.away_team_id
      WHERE m.tournament_id=:tid`, { tid });
  for (const [home, away, hs, as] of results) {
    const m = matches.find((x: any) =>
      (x.home === home && x.away === away) || (x.home === away && x.away === home));
    if (!m) continue;
    // orient score to actual home/away ordering of the fixture
    const [h, a] = m.home === home ? [hs, as] : [as, hs];
    const winnerName = h > a ? m.home : a > h ? m.away : null;
    let winnerId: number | null = null;
    if (winnerName) {
      const [w]: any = await pool.query(`SELECT id FROM teams WHERE tournament_id=:tid AND name=:n`, { tid, n: winnerName });
      winnerId = w[0]?.id ?? null;
    }
    await pool.query(
      `UPDATE matches SET home_score=:h, away_score=:a, status='COMPLETED', winner_team_id=:w WHERE id=:id`,
      { h, a, w: winnerId, id: m.id });
  }
}

async function ensureAdmin() {
  const pw = await hashPassword('Admin@123');
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role_id) VALUES ('Super Admin','admin@sportsleague.dev',:pw,1)
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`, { pw });
}

async function run() {
  console.log('\n🌍 Seeding REAL data (Pakistan + international)\n');
  await ensureAdmin();
  await clearData();

  const cricket = await seedTournament('Asia Cup 2026', 2, 'ROUND_ROBIN', CRICKET, 'Lahore, Pakistan');
  await playMatches(cricket.tid, [
    ['Pakistan', 'India', 287, 264],
    ['Pakistan', 'Sri Lanka', 301, 188],
    ['India', 'Bangladesh', 256, 201],
    ['Afghanistan', 'Sri Lanka', 234, 230],
    ['Pakistan', 'Afghanistan', 245, 198],
    ['India', 'Sri Lanka', 278, 245],
  ], CRICKET);
  console.log('✓ Cricket — Asia Cup 2026 (5 teams, real squads)');

  const football = await seedTournament('International Champions Cup 2026', 1, 'ROUND_ROBIN', FOOTBALL, 'London, England');
  await playMatches(football.tid, [
    ['Argentina', 'France', 2, 1],
    ['Brazil', 'England', 3, 2],
    ['Argentina', 'Brazil', 1, 1],
    ['France', 'England', 2, 2],
    ['Argentina', 'England', 3, 1],
    ['France', 'Brazil', 2, 0],
  ], FOOTBALL);
  console.log('✓ Football — International Champions Cup 2026 (4 teams, real squads)');

  const basketball = await seedTournament('FIBA World Cup 2026', 3, 'KNOCKOUT', BASKETBALL, 'Manila, Philippines');
  await playMatches(basketball.tid, [
    ['USA', 'Slovenia', 98, 91],
    ['Serbia', 'Australia', 88, 79],
    ['France', 'Spain', 84, 80],
    ['Canada', 'Germany', 95, 90],
  ], BASKETBALL);
  console.log('✓ Basketball — FIBA World Cup 2026 (8 teams, real squads)');

  // headline counts
  const [[c]]: any = await pool.query(`SELECT
    (SELECT COUNT(*) FROM tournaments) t, (SELECT COUNT(*) FROM teams) tm,
    (SELECT COUNT(*) FROM players) p, (SELECT COUNT(*) FROM matches) m`);
  console.log(`\n✅ Done — ${c.t} tournaments, ${c.tm} teams, ${c.p} players, ${c.m} matches`);
  console.log('   Login: admin@sportsleague.dev / Admin@123\n');
  await pool.end();
}

run().catch(async (err) => {
  console.error('✗ Real seed failed:', err.message);
  await pool.end();
  process.exit(1);
});
