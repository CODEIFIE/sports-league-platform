import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader, EmptyState } from '@/components/shared';
import { MatchCard } from '@/components/MatchCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { canScore, useAuth } from '@/store/auth';
import type { Match, Paginated, Tournament } from '@/types';

export default function Matches() {
  const scorer = canScore(useAuth((s) => s.user?.role));
  const [tournamentId, setTournamentId] = useState('all');
  const [status, setStatus] = useState('all');

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', 'all'],
    queryFn: async () => (await api.get<Paginated<Tournament>>('/tournaments', { params: { limit: 100 } })).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['matches', tournamentId, status],
    queryFn: async () => (await api.get<{ data: Match[] }>('/matches', {
      params: {
        tournamentId: tournamentId === 'all' ? undefined : tournamentId,
        status: status === 'all' ? undefined : status,
      },
    })).data.data,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Matches" subtitle="All fixtures and results" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={tournamentId} onValueChange={setTournamentId}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="All tournaments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tournaments</SelectItem>
            {tournaments?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].map((s) =>
              <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !data?.length ? (
        <EmptyState title="No matches found" hint="Generate fixtures from a tournament page." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <MatchCard key={m.id} match={m}
              to={scorer ? `/app/live/${m.id}` : undefined} />
          ))}
        </div>
      )}

      {scorer && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Radio className="h-4 w-4" /> Click any match to open the live scoring console.
        </p>
      )}
    </div>
  );
}
