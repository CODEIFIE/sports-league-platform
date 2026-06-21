import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trophy, Award, Moon, Sun } from 'lucide-react';
import { api } from '@/services/api';
import { getSocket } from '@/services/socket';
import { useTheme } from '@/components/theme-provider';
import { LiquidBackground } from '@/components/LiquidBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import { CricketLive, CricketScorecards, FootballView, Commentary } from '@/pages/live/matchViews';
import type { Match } from '@/types';

export default function MatchDetail() {
  const { id } = useParams();
  const matchId = Number(id);
  const qc = useQueryClient();
  const { theme, toggle } = useTheme();
  const [live, setLive] = useState<any>(null);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => (await api.get<{ data: Match & { summary: any; momName: string | null } }>(`/matches/${matchId}`)).data.data,
    refetchInterval: 12_000,
  });

  useEffect(() => {
    const s = getSocket();
    s.emit('match:join', matchId);
    const onState = (st: any) => setLive(st);
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['match', matchId] });
    s.on('match:state', onState); s.on('match:update', onUpdate);
    return () => { s.emit('match:leave', matchId); s.off('match:state', onState); s.off('match:update', onUpdate); };
  }, [matchId, qc]);

  const sport = match?.sport_code;
  const completed = match?.status === 'COMPLETED';
  const isLive = match?.status === 'LIVE';
  const view = live ?? match?.summary;
  const momName = view?.mom?.name ?? match?.momName;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <LiquidBackground />
      <header className="sticky top-0 z-30">
        <div className="container mt-4">
          <div className="glass flex h-14 items-center justify-between rounded-2xl px-4">
            <Button asChild variant="ghost" size="sm"><Link to="/scoreboard"><ArrowLeft className="h-4 w-4" /> Scoreboard</Link></Button>
            <Button variant="ghost" size="icon" onClick={toggle}>{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl space-y-5 py-6">
        {isLoading || !match ? (
          <Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="truncate text-sm text-muted-foreground">{match.tournament_name}</span>
              <Badge variant={isLive ? 'live' : completed ? 'secondary' : 'outline'}>{isLive ? '● LIVE' : match.status}</Badge>
            </div>

            <Card>
              <CardContent className="relative grid grid-cols-3 items-center gap-2 py-6 sm:gap-4 sm:py-8">
                <div className="absolute inset-0 -z-10 bg-mesh-ucp opacity-30" />
                <Side name={match.home_team} />
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums sm:text-5xl">
                    {match.home_score}{sport === 'CRICKET' && match.home_wickets != null ? `/${match.home_wickets}` : ''}
                    <span className="mx-1 text-muted-foreground sm:mx-2">:</span>
                    {match.away_score}{sport === 'CRICKET' && match.away_wickets != null ? `/${match.away_wickets}` : ''}
                  </div>
                  {view?.result && <p className="mt-1 text-xs font-semibold text-primary sm:text-sm">{view.result}</p>}
                </div>
                <Side name={match.away_team} />
              </CardContent>
            </Card>

            {completed && momName && (
              <div className="glass flex flex-col items-center gap-1 rounded-2xl p-4 text-center ring-glow">
                <Trophy className="h-6 w-6 text-primary" />
                <p className="font-bold">{view?.result}</p>
                <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Award className="h-4 w-4 text-gold" /> Player of the Match: <b className="text-foreground">{momName}</b>
                  {view?.mom?.line && <span>· {view.mom.line}</span>}
                </p>
              </div>
            )}

            {view ? (
              <>
                {sport === 'CRICKET' && (completed ? <CricketScorecards view={view} /> : <CricketLive view={view} />)}
                {sport === 'FOOTBALL' && <FootballView view={view} />}
                <Commentary lines={view.commentary ?? []} />
              </>
            ) : (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                {match.status === 'SCHEDULED' ? 'This match has not started yet.' : 'No live details available.'}
              </CardContent></Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Side({ name }: { name: string | null }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-base font-bold text-primary ring-1 ring-inset ring-primary/20 sm:h-16 sm:w-16 sm:text-xl">{initials(name)}</div>
      <p className="mt-2 truncate text-sm font-semibold sm:text-base">{name ?? 'TBD'}</p>
    </div>
  );
}
