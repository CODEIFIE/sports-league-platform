import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wand2, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/services/api';
import { MatchCard } from '@/components/MatchCard';
import { Bracket } from '@/components/Bracket';
import { StandingsTable } from '@/components/StandingsTable';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { isAdmin, canScore, useAuth } from '@/store/auth';
import type { Match, Paginated, Standing, Team, Tournament } from '@/types';

export default function TournamentDetail() {
  const { id } = useParams();
  const tid = Number(id);
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const admin = isAdmin(role);
  const scorer = canScore(role);

  const { data: t, isLoading } = useQuery({
    queryKey: ['tournament', tid],
    queryFn: async () => (await api.get<{ data: Tournament }>(`/tournaments/${tid}`)).data.data,
  });
  const { data: teams } = useQuery({
    queryKey: ['teams', 'tournament', tid],
    queryFn: async () => (await api.get<Paginated<Team>>('/teams', { params: { tournamentId: tid, limit: 100 } })).data.data,
  });
  const { data: matches } = useQuery({
    queryKey: ['matches', 'tournament', tid],
    queryFn: async () => (await api.get<{ data: Match[] }>('/matches', { params: { tournamentId: tid } })).data.data,
  });
  const { data: standings } = useQuery({
    queryKey: ['standings', tid],
    queryFn: async () => (await api.get<{ data: Standing[] }>(`/stats/standings/${tid}`)).data.data,
  });

  const generate = useMutation({
    mutationFn: () => api.post('/matches/generate', { tournamentId: tid, format: t!.format }),
    onSuccess: () => { toast.success('Fixtures generated'); qc.invalidateQueries({ queryKey: ['matches', 'tournament', tid] }); },
    onError: (e) => toast.error(apiError(e)),
  });
  const recalc = useMutation({
    mutationFn: () => api.post(`/matches/recalc/${tid}`),
    onSuccess: () => { toast.success('Standings recalculated'); qc.invalidateQueries({ queryKey: ['standings', tid] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !t) return <Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/app/tournaments"><ArrowLeft className="h-4 w-4" /> Tournaments</Link></Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <Badge variant={t.status === 'ONGOING' ? 'success' : 'secondary'}>{t.status}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{t.sport} · {t.format.replace('_', ' ')}</span>
            {t.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.location}</span>}
          </p>
        </div>
        {admin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => recalc.mutate()} disabled={recalc.isPending}>
              <RefreshCw className="h-4 w-4" /> Recalc standings
            </Button>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <Wand2 className="h-4 w-4" /> Generate fixtures
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="fixtures">
        <TabsList>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          {t.format === 'KNOCKOUT' && <TabsTrigger value="bracket">Bracket</TabsTrigger>}
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="fixtures" className="mt-4">
          {!matches?.length ? (
            <EmptyState title="No fixtures yet" hint={admin ? 'Click "Generate fixtures" to create the schedule.' : undefined} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => <MatchCard key={m.id} match={m} to={scorer ? `/app/live/${m.id}` : undefined} />)}
            </div>
          )}
        </TabsContent>

        {t.format === 'KNOCKOUT' && (
          <TabsContent value="bracket" className="mt-4">
            {matches?.length ? <Bracket matches={matches} /> : <EmptyState title="No bracket yet" />}
          </TabsContent>
        )}

        <TabsContent value="standings" className="mt-4">
          <Card><CardContent className="pt-6"><StandingsTable rows={standings ?? []} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          {!teams?.length ? <EmptyState title="No teams registered" /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card key={team.id} className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 font-bold text-primary">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">{team.player_count} players</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
