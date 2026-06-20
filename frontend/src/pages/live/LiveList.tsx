import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/services/api';
import { PageHeader, EmptyState } from '@/components/shared';
import { MatchCard } from '@/components/MatchCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Match } from '@/types';

interface SimStatus { auto: boolean; tournamentId: number | null; live: number[] }

export default function LiveList() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['matches', 'scoreable'],
    queryFn: async () => (await api.get<{ data: Match[] }>('/matches')).data.data,
    refetchInterval: 5_000,
  });

  const { data: sim } = useQuery({
    queryKey: ['sim-status'],
    queryFn: async () => (await api.get<{ data: SimStatus }>('/sim/status')).data.data,
    refetchInterval: 4_000,
  });

  const startAuto = useMutation({
    mutationFn: () => api.post('/sim/auto', { maxConcurrent: 2 }),
    onSuccess: () => { toast.success('Auto-Live started — matches will play themselves'); qc.invalidateQueries({ queryKey: ['sim-status'] }); },
    onError: (e) => toast.error(apiError(e)),
  });
  const stopAuto = useMutation({
    mutationFn: () => api.post('/sim/stop'),
    onSuccess: () => { toast('Auto-Live stopped'); qc.invalidateQueries({ queryKey: ['sim-status'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  const live = data?.filter((m) => m.status === 'LIVE') ?? [];
  const scheduled = data?.filter((m) => m.status === 'SCHEDULED') ?? [];
  const running = sim?.auto || (sim?.live.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Scoring"
        subtitle="Let matches play automatically, or score one manually"
        action={
          running ? (
            <Button variant="destructive" onClick={() => stopAuto.mutate()} disabled={stopAuto.isPending}>
              {stopAuto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Stop Auto-Live
            </Button>
          ) : (
            <Button onClick={() => startAuto.mutate()} disabled={startAuto.isPending} className="animate-glow-pulse">
              {startAuto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Start Auto-Live
            </Button>
          )
        }
      />

      {running && (
        <div className="glass flex items-center gap-3 rounded-2xl p-4">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400" style={{ animation: 'live-ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium">
            Auto-Live is running — {sim?.live.length ?? 0} match(es) playing. Scores update automatically;
            watch them on the <a href="/scoreboard" target="_blank" className="text-primary underline">public scoreboard</a>.
          </span>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-destructive" /> LIVE NOW
            </h2>
            {live.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {live.map((m) => <MatchCard key={m.id} match={m} to={`/app/live/${m.id}`} />)}
              </div>
            ) : <EmptyState title="No live matches" hint='Hit "Start Auto-Live" to play scheduled matches automatically.' />}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">SCHEDULED ({scheduled.length})</h2>
            {scheduled.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scheduled.map((m) => <MatchCard key={m.id} match={m} to={`/app/live/${m.id}`} />)}
              </div>
            ) : <p className="text-sm text-muted-foreground">No scheduled matches.</p>}
          </section>
        </>
      )}
    </div>
  );
}
