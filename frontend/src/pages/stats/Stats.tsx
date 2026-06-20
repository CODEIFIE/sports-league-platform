import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import { Award } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader, EmptyState } from '@/components/shared';
import { StandingsTable } from '@/components/StandingsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CHART_COLORS, baseOptions } from '@/lib/charts';
import { initials } from '@/lib/utils';
import type { Paginated, Standing, Tournament } from '@/types';
import '@/lib/charts';

const METRICS = [
  { key: 'goals', label: 'Top Scorers' },
  { key: 'assists', label: 'Top Assists' },
  { key: 'points', label: 'Top Points' },
  { key: 'runs', label: 'Most Runs' },
  { key: 'wickets', label: 'Most Wickets' },
  { key: 'yellow', label: 'Yellow Cards' },
  { key: 'red', label: 'Red Cards' },
];

interface TopPlayer { player_id: number; player_name: string; team_name: string; photo_url: string | null; metric_value: number }

export default function Stats() {
  const [tournamentId, setTournamentId] = useState<string>('');
  const [metric, setMetric] = useState('goals');

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', 'all'],
    queryFn: async () => (await api.get<Paginated<Tournament>>('/tournaments', { params: { limit: 100 } })).data.data,
  });

  useEffect(() => {
    if (!tournamentId && tournaments?.length) setTournamentId(String(tournaments[0].id));
  }, [tournaments, tournamentId]);

  const { data: standings, isLoading: loadingStandings } = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: async () => (await api.get<{ data: Standing[] }>(`/stats/standings/${tournamentId}`)).data.data,
    enabled: !!tournamentId,
  });

  const { data: top } = useQuery({
    queryKey: ['top-players', tournamentId, metric],
    queryFn: async () => (await api.get<{ data: TopPlayer[] }>(`/stats/top-players/${tournamentId}`, {
      params: { metric, limit: 10 },
    })).data.data,
    enabled: !!tournamentId,
  });

  const { data: mvp } = useQuery({
    queryKey: ['mvp', tournamentId],
    queryFn: async () => (await api.get<{ data: any }>(`/stats/mvp/${tournamentId}`)).data.data,
    enabled: !!tournamentId,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics" subtitle="Standings and player leaderboards"
        action={
          <Select value={tournamentId} onValueChange={setTournamentId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select tournament" /></SelectTrigger>
            <SelectContent>
              {tournaments?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      {!tournamentId ? (
        <EmptyState title="Select a tournament" />
      ) : (
        <>
        {mvp && (
          <div className="glass flex items-center gap-4 rounded-2xl p-5 ring-glow">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-2xl">🏅</div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">Man of the Tournament</p>
              <p className="text-xl font-bold">{mvp.player_name}</p>
              <p className="text-sm text-muted-foreground">
                {mvp.team_name} ·{' '}
                {[mvp.goals && `${mvp.goals} goals`, mvp.assists && `${mvp.assists} assists`,
                  mvp.runs && `${mvp.runs} runs`, mvp.wickets && `${mvp.wickets} wkts`,
                  mvp.points && `${mvp.points} pts`].filter(Boolean).join(' · ') || 'top performer'}
              </p>
            </div>
            <Award className="hidden h-8 w-8 text-amber-500 sm:block" />
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Standings</CardTitle></CardHeader>
            <CardContent>
              {loadingStandings ? <Skeleton className="h-64" /> : <StandingsTable rows={standings ?? []} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Leaderboard</CardTitle>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-4">
              {top && top.length > 0 ? (
                <>
                  <div className="h-48">
                    <Bar options={baseOptions} data={{
                      labels: top.slice(0, 6).map((p) => p.player_name.split(' ')[0]),
                      datasets: [{ data: top.slice(0, 6).map((p) => p.metric_value), backgroundColor: CHART_COLORS[0], borderRadius: 6 }],
                    }} />
                  </div>
                  <div className="space-y-1">
                    {top.map((p, i) => (
                      <div key={p.player_id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent">
                        <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(p.player_name)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{p.player_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.team_name}</p>
                        </div>
                        <span className="text-lg font-bold tabular-nums">{p.metric_value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="No data for this metric" />}
            </CardContent>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}
