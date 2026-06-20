import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, initials } from '@/lib/utils';
import type { Match } from '@/types';

const statusVariant: Record<string, any> = {
  LIVE: 'live', COMPLETED: 'secondary', SCHEDULED: 'outline', CANCELLED: 'destructive',
};

function TeamSide({ name, logo, align }: { name: string | null; logo: string | null; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-1 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {logo
        ? <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
        : <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">{initials(name)}</div>}
      <span className="truncate text-sm font-medium">{name ?? 'TBD'}</span>
    </div>
  );
}

export function MatchCard({ match, to }: { match: Match; to?: string }) {
  const isCricket = match.sport_code === 'CRICKET';
  const live = match.status === 'LIVE';
  const body = (
    <Card className={`p-4 transition-all duration-300 hover:-translate-y-1 ${live ? 'border-destructive/40 shadow-[0_0_28px_-8px_rgba(239,68,68,0.45)]' : ''}`}>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{match.tournament_name}</span>
        <Badge variant={statusVariant[match.status]}>
          {match.status === 'LIVE' ? `● LIVE` : match.status}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <TeamSide name={match.home_team} logo={match.home_logo} align="left" />
        <div className="shrink-0 text-center">
          {match.status === 'SCHEDULED' ? (
            <span className="text-xs text-muted-foreground">{formatDate(match.scheduled_at)}</span>
          ) : (
            <div className="text-xl font-bold tabular-nums">
              {match.home_score} : {match.away_score}
              {isCricket && (match.home_wickets != null || match.away_wickets != null) && (
                <div className="text-[10px] font-normal text-muted-foreground">
                  {match.home_wickets ?? 0}w · {match.away_wickets ?? 0}w
                </div>
              )}
            </div>
          )}
        </div>
        <TeamSide name={match.away_team} logo={match.away_logo} align="right" />
      </div>
      {match.venue && <p className="mt-2 text-center text-[11px] text-muted-foreground">{match.venue}</p>}
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
