export type Role = 'SUPER_ADMIN' | 'TOURNAMENT_ADMIN' | 'MATCH_OFFICIAL' | 'PUBLIC_VIEWER';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Sport {
  id: number;
  code: 'FOOTBALL' | 'CRICKET' | 'BASKETBALL';
  name: string;
  score_label: string;
}

export interface Tournament {
  id: number;
  name: string;
  sport: string;
  sport_code: string;
  format: 'ROUND_ROBIN' | 'KNOCKOUT';
  status: 'DRAFT' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  team_count: number;
  match_count: number;
  completed_count: number;
  live_count: number;
}

export interface Team {
  id: number;
  tournament_id: number;
  name: string;
  logo_url: string | null;
  coach: string | null;
  captain: string | null;
  contact: string | null;
  player_count: number;
}

export interface Player {
  id: number;
  team_id: number;
  team_name: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  age: number | null;
  photo_url: string | null;
}

export interface MatchEvent {
  id: number;
  event_type: string;
  value: number;
  minute: number | null;
  note: string | null;
  created_at: string;
  team_name: string | null;
  player_name: string | null;
}

export interface Match {
  id: number;
  tournament_id: number;
  tournament_name: string;
  sport_code: string;
  score_label: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  round_no: number | null;
  bracket_stage: 'GROUP' | 'QUARTER' | 'SEMI' | 'FINAL' | null;
  scheduled_at: string | null;
  venue: string | null;
  minute_clock: number;
  home_team_id: number | null;
  home_team: string | null;
  home_logo: string | null;
  away_team_id: number | null;
  away_team: string | null;
  away_logo: string | null;
  home_score: number;
  away_score: number;
  home_wickets: number | null;
  away_wickets: number | null;
  home_overs: number | null;
  away_overs: number | null;
  events?: MatchEvent[];
}

export interface Standing {
  tournament_id: number;
  team_id: number;
  team_name: string;
  logo_url: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  squad_size: number;
}

export interface PlayerStat {
  player_id: number;
  player_name: string;
  photo_url: string | null;
  team_id: number;
  team_name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  points: number;
  fouls: number;
  runs: number;
  wickets: number;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: number;
  created_at: string;
}

export interface DashboardData {
  counts: Record<string, number>;
  charts: {
    matchesPerTournament: { label: string; value: number }[];
    goalsPerTournament: { label: string; value: number }[];
    winsDistribution: { wins: number; draws: number; losses: number };
    topTeams: { label: string; value: number }[];
  };
  recent: { entity: string; action: string; detail: string | null; created_at: string }[];
}

export interface Paginated<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}
