import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Trophy, ListChecks, BarChart3, Award, ClipboardList } from 'lucide-react';
import { api, API_BASE } from '@/services/api';
import { PageHeader, EmptyState } from '@/components/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Paginated, Standing, Tournament } from '@/types';

const REPORTS = [
  { key: 'fixtures', label: 'Fixtures', desc: 'All scheduled matches', icon: ListChecks },
  { key: 'results', label: 'Results', desc: 'Completed match scores', icon: ClipboardList },
  { key: 'standings', label: 'Standings', desc: 'League table', icon: BarChart3 },
  { key: 'player-stats', label: 'Player Statistics', desc: 'Goals, assists, cards & more', icon: BarChart3 },
  { key: 'tournament', label: 'Tournament Report', desc: 'Full summary document', icon: Trophy },
];

export default function Reports() {
  const [tournamentId, setTournamentId] = useState('');

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', 'all'],
    queryFn: async () => (await api.get<Paginated<Tournament>>('/tournaments', { params: { limit: 100 } })).data.data,
  });

  useEffect(() => {
    if (!tournamentId && tournaments?.length) setTournamentId(String(tournaments[0].id));
  }, [tournaments, tournamentId]);

  const { data: standings } = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: async () => (await api.get<{ data: Standing[] }>(`/stats/standings/${tournamentId}`)).data.data,
    enabled: !!tournamentId,
  });

  const open = (key: string, extra = '') =>
    window.open(`${API_BASE}/api/reports/${key}/${tournamentId}${extra}`, '_blank');

  const champion = standings?.[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate printable PDF documents"
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <Card key={r.key} className="flex flex-col p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{r.label}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{r.desc}</p>
              <Button variant="outline" className="mt-4" onClick={() => open(r.key)}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </Card>
          ))}

          <Card className="flex flex-col p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold">Winner Certificate</h3>
            <p className="flex-1 text-sm text-muted-foreground">
              {champion ? `For ${champion.team_name}` : 'Available once standings exist'}
            </p>
            <Button variant="outline" className="mt-4" disabled={!champion}
              onClick={() => open('certificate', `?team=${encodeURIComponent(champion!.team_name)}&title=Champion`)}>
              <FileText className="h-4 w-4" /> Generate
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
