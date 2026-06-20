import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Square, Loader2, Trophy, Award } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api, apiError } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { canScore, useAuth } from '@/store/auth';
import { initials } from '@/lib/utils';
import {
  CricketLive, CricketScorecards, FootballView, BasketballView, Commentary,
} from './matchViews';
import type { Match } from '@/types';

export default function MatchCentre() {
  const { id } = useParams();
  const matchId = Number(id);
  const qc = useQueryClient();
  const scorer = canScore(useAuth((s) => s.user?.role));
  const [live, setLive] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => (await api.get<{ data: Match & { summary: any; momName: string | null } }>(`/matches/${matchId}`)).data.data,
  });

  useEffect(() => {
    const socket = getSocket();
    socket.emit('match:join', matchId);
    api.get(`/sim/state/${matchId}`).then(({ data }) => { if (data.data) setLive(data.data); }).catch(() => {});
    const onState = (s: any) => setLive(s);
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['match', matchId] });
    socket.on('match:state', onState);
    socket.on('match:update', onUpdate);
    return () => {
      socket.emit('match:leave', matchId);
      socket.off('match:state', onState);
      socket.off('match:update', onUpdate);
    };
  }, [matchId, qc]);

  const simOne = async () => {
    setBusy(true);
    try { await api.post(`/sim/match/${matchId}`); toast.success('Match simulation started'); }
    catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };
  const endMatch = async () => {
    setBusy(true);
    try {
      const winner = match!.home_score > match!.away_score ? match!.home_team_id
        : match!.away_score > match!.home_score ? match!.away_team_id : null;
      await api.patch(`/matches/${matchId}/status`, { status: 'COMPLETED', winnerTeamId: winner });
      qc.invalidateQueries({ queryKey: ['match', matchId] });
      toast.success('Match completed');
    } catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };

  if (isLoading || !match) return <Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin text-muted-foreground" />;

  const completed = match.status === 'COMPLETED';
  const isLive = match.status === 'LIVE';
  const view = live ?? match.summary; // live socket state, else persisted final state
  const sport = match.sport_code;
  const momName = view?.mom?.name ?? match.momName;
  const momLine = view?.mom?.line;
  const result = view?.result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm"><Link to="/app/live"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        <Badge variant={isLive ? 'live' : completed ? 'secondary' : 'outline'}>
          {isLive ? '● LIVE' : match.status}
        </Badge>
      </div>

      {/* Scoreboard header */}
      <Card className="overflow-hidden">
        <CardContent className="relative grid grid-cols-3 items-center gap-4 py-8">
          <div className="absolute inset-0 -z-10 bg-mesh-green opacity-30" />
          <Team name={match.home_team} />
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums">
              {match.home_score}{sport === 'CRICKET' && match.home_wickets != null ? `/${match.home_wickets}` : ''}
              <span className="mx-2 text-muted-foreground">:</span>
              {match.away_score}{sport === 'CRICKET' && match.away_wickets != null ? `/${match.away_wickets}` : ''}
            </div>
            <p className="mt-1 text-xs uppercase text-muted-foreground">{match.tournament_name}</p>
            {result && <p className="mt-2 text-sm font-semibold text-primary">{result}</p>}
          </div>
          <Team name={match.away_team} />
        </CardContent>
      </Card>

      {/* Winner + Man of the Match */}
      {completed && (momName || result) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center gap-2 rounded-2xl p-6 text-center ring-glow">
          <Trophy className="h-7 w-7 text-primary" />
          <p className="text-lg font-bold">{result}</p>
          {momName && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4 text-amber-500" /> Player of the Match: <b className="text-foreground">{momName}</b>
              {momLine && <span>· {momLine}</span>}
            </p>
          )}
        </motion.div>
      )}

      {/* Official controls */}
      {scorer && !completed && (
        <div className="flex flex-wrap gap-2">
          {match.status === 'SCHEDULED' && <Button onClick={simOne} disabled={busy}><Play className="h-4 w-4" /> Start (auto-play)</Button>}
          {isLive && <Button variant="destructive" onClick={() => setEndOpen(true)} disabled={busy}><Square className="h-4 w-4" /> End now</Button>}
        </div>
      )}

      {/* Per-sport live / final panels */}
      {view ? (
        <>
          {sport === 'CRICKET' && (completed ? <CricketScorecards view={view} /> : <CricketLive view={view} />)}
          {sport === 'FOOTBALL' && <FootballView view={view} />}
          {sport === 'BASKETBALL' && <BasketballView view={view} />}
          <Commentary lines={view.commentary ?? []} />
        </>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {match.status === 'SCHEDULED' ? 'Match not started yet.' : 'Waiting for live data…'}
        </CardContent></Card>
      )}

      <ConfirmDialog open={endOpen} onOpenChange={setEndOpen}
        title="End match now?" description="Final score is recorded and standings update automatically."
        confirmLabel="End match" onConfirm={endMatch} />
    </div>
  );
}

function Team({ name }: { name: string | null }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-xl font-bold text-primary ring-1 ring-inset ring-primary/20">{initials(name)}</div>
      <p className="mt-2 font-semibold">{name ?? 'TBD'}</p>
    </div>
  );
}
