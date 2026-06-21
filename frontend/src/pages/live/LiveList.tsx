import { useQuery } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader, EmptyState } from '@/components/shared';
import { MatchCard } from '@/components/MatchCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Match } from '@/types';

export default function LiveList() {
  const { data, isLoading } = useQuery({
    queryKey: ['matches', 'scoreable'],
    queryFn: async () => (await api.get<{ data: Match[] }>('/matches')).data.data,
    refetchInterval: 8_000,
  });

  const live = data?.filter((m) => m.status === 'LIVE') ?? [];
  const scheduled = data?.filter((m) => m.status === 'SCHEDULED') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Live Scoring" subtitle="Pick a match to score it manually, ball by ball" />

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Radio className="h-4 w-4 text-destructive" /> LIVE NOW
            </h2>
            {live.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((m) => <MatchCard key={m.id} match={m} to={`/app/live/${m.id}`} />)}
              </div>
            ) : <EmptyState title="No live matches" hint="Open a scheduled match below to start scoring." />}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">SCHEDULED ({scheduled.length})</h2>
            {scheduled.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scheduled.map((m) => <MatchCard key={m.id} match={m} to={`/app/live/${m.id}`} />)}
              </div>
            ) : <p className="text-sm text-muted-foreground">No scheduled matches.</p>}
          </section>
        </>
      )}
    </div>
  );
}
