import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/services/api';
import { PageHeader, EmptyState, Pagination } from '@/components/shared';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TeamForm } from './TeamForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { isAdmin, useAuth } from '@/store/auth';
import { initials } from '@/lib/utils';
import type { Paginated, Team, Tournament } from '@/types';

export default function Teams() {
  const qc = useQueryClient();
  const admin = isAdmin(useAuth((s) => s.user?.role));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tournamentId, setTournamentId] = useState<string>('all');
  const [editing, setEditing] = useState<Team | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', 'all'],
    queryFn: async () => (await api.get<Paginated<Tournament>>('/tournaments', { params: { limit: 100 } })).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, search, tournamentId],
    queryFn: async () => (await api.get<Paginated<Team>>('/teams', {
      params: { page, limit: 9, search, tournamentId: tournamentId === 'all' ? undefined : tournamentId },
    })).data,
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/teams/${id}`),
    onSuccess: () => { toast.success('Team deleted'); qc.invalidateQueries({ queryKey: ['teams'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Teams" subtitle="Registered teams across tournaments"
        action={admin && <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Team</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search teams…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={tournamentId} onValueChange={(v) => { setTournamentId(v); setPage(1); }}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="All tournaments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tournaments</SelectItem>
            {tournaments?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState title="No teams found" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((team) => (
            <Card key={team.id} className="p-5">
              <div className="flex items-center gap-3">
                {team.logo_url
                  ? <img src={team.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  : <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 font-bold text-primary">{initials(team.name)}</div>}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{team.name}</p>
                  <p className="text-sm text-muted-foreground">{team.player_count} players</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {team.coach && <p>Coach: {team.coach}</p>}
                {team.captain && <p>Captain: {team.captain}</p>}
              </div>
              {admin && (
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(team); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(team.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {data && <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />}

      <TeamForm open={formOpen} onOpenChange={setFormOpen} team={editing} tournaments={tournaments ?? []} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete team?" description="Players and related records will be removed."
        onConfirm={async () => { if (deleteId) await del.mutateAsync(deleteId); }} />
    </div>
  );
}
