import { useQuery } from '@tanstack/react-query';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Trophy, Radio, Users, UserSquare2, CalendarDays, Clock, Activity,
} from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader, StatCard } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS, baseOptions } from '@/lib/charts';
import { formatDate } from '@/lib/utils';
import type { DashboardData } from '@/types';
import '@/lib/charts';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<{ data: DashboardData }>('/stats/dashboard')).data.data,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const c = data.counts;
  const cards = [
    { label: 'Tournaments', value: c.tournaments, icon: Trophy },
    { label: 'Active', value: c.active_tournaments, icon: Radio, accent: 'bg-success/10 text-success' },
    { label: 'Teams', value: c.teams, icon: Users },
    { label: 'Players', value: c.players, icon: UserSquare2 },
    { label: 'Matches', value: c.matches, icon: CalendarDays },
    { label: 'Upcoming', value: c.upcoming_matches, icon: Clock, accent: 'bg-amber-500/10 text-amber-500' },
  ];

  const wins = data.charts.winsDistribution;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Overview of all tournaments and activity" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => <StatCard key={card.label} index={i} {...card} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Matches per Tournament</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar
              options={baseOptions}
              data={{
                labels: data.charts.matchesPerTournament.map((d) => d.label),
                datasets: [{ data: data.charts.matchesPerTournament.map((d) => d.value), backgroundColor: CHART_COLORS[0], borderRadius: 6 }],
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Goals / Points Scored</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar
              options={baseOptions}
              data={{
                labels: data.charts.goalsPerTournament.map((d) => d.label),
                datasets: [{ data: data.charts.goalsPerTournament.map((d) => d.value), backgroundColor: CHART_COLORS[1], borderRadius: 6 }],
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Results Distribution</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Doughnut
              data={{
                labels: ['Wins', 'Draws', 'Losses'],
                datasets: [{
                  data: [wins.wins ?? 0, wins.draws ?? 0, wins.losses ?? 0],
                  backgroundColor: [CHART_COLORS[2], CHART_COLORS[3], CHART_COLORS[4]],
                  borderWidth: 0,
                }],
              }}
              options={{ ...baseOptions, scales: undefined, plugins: { legend: { display: true, position: 'bottom' } } } as any}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Teams by Points</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar
              options={{ ...baseOptions, indexAxis: 'y' as const }}
              data={{
                labels: data.charts.topTeams.map((d) => d.label),
                datasets: [{ data: data.charts.topTeams.map((d) => d.value), backgroundColor: CHART_COLORS[5], borderRadius: 6 }],
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.recent.length === 0 && <p className="text-sm text-muted-foreground">No recent activity</p>}
          {data.recent.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span><span className="font-medium capitalize">{r.entity}</span> · {r.action} {r.detail ? `(${r.detail})` : ''}</span>
              <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
