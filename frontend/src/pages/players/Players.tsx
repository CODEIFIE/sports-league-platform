import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/services/api';
import { PageHeader, EmptyState, Pagination } from '@/components/shared';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PlayerForm } from './PlayerForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { isAdmin, useAuth } from '@/store/auth';
import { initials } from '@/lib/utils';
import type { Paginated, Player, Team } from '@/types';

export default function Players() {
  const qc = useQueryClient();
  const admin = isAdmin(useAuth((s) => s.user?.role));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [teamId, setTeamId] = useState('all');
  const [editing, setEditing] = useState<Player | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: teams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: async () => (await api.get<Paginated<Team>>('/teams', { params: { limit: 200 } })).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['players', page, search, teamId],
    queryFn: async () => (await api.get<Paginated<Player>>('/players', {
      params: { page, limit: 12, search, teamId: teamId === 'all' ? undefined : teamId },
    })).data,
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/players/${id}`),
    onSuccess: () => { toast.success('Player deleted'); qc.invalidateQueries({ queryKey: ['players'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Players" subtitle="Squad rosters across all teams"
        action={admin && <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Player</Button>} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search players…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={teamId} onValueChange={(v) => { setTeamId(v); setPage(1); }}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="All teams" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-80" />
      ) : !data?.data.length ? (
        <EmptyState title="No players found" />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Player</TH><TH>Team</TH><TH>#</TH><TH>Position</TH><TH>Age</TH>
                {admin && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {data.data.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      {p.photo_url
                        ? <img src={p.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                        : <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(p.name)}</div>}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TD>
                  <TD className="text-muted-foreground">{p.team_name}</TD>
                  <TD>{p.jersey_number ?? '—'}</TD>
                  <TD className="text-muted-foreground">{p.position ?? '—'}</TD>
                  <TD>{p.age ?? '—'}</TD>
                  {admin && (
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {data && <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />}

      <PlayerForm open={formOpen} onOpenChange={setFormOpen} player={editing} teams={teams ?? []} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete player?" onConfirm={async () => { if (deleteId) await del.mutateAsync(deleteId); }} />
    </div>
  );
}
