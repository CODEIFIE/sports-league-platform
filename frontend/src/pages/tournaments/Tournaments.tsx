import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError } from '@/services/api';
import { PageHeader, EmptyState, Pagination } from '@/components/shared';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TournamentForm } from './TournamentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { isAdmin, useAuth } from '@/store/auth';
import type { Paginated, Tournament } from '@/types';

const statusVariant: Record<string, any> = {
  ONGOING: 'success', COMPLETED: 'secondary', DRAFT: 'outline', CANCELLED: 'destructive',
};

export default function Tournaments() {
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const admin = isAdmin(role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', page, search],
    queryFn: async () =>
      (await api.get<Paginated<Tournament>>('/tournaments', { params: { page, limit: 9, search } })).data,
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/tournaments/${id}`),
    onSuccess: () => { toast.success('Tournament deleted'); qc.invalidateQueries({ queryKey: ['tournaments'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        subtitle="Create and manage competitions"
        action={admin && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> New Tournament
          </Button>
        )}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search tournaments…"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState title="No tournaments yet" hint={admin ? 'Create your first tournament to get started.' : undefined} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((t) => (
            <Card key={t.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
                <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
              </div>
              <Link to={`/app/tournaments/${t.id}`} className="mt-3 font-semibold hover:text-primary">
                {t.name}
              </Link>
              <p className="text-sm text-muted-foreground">{t.sport} · {t.format.replace('_', ' ')}</p>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{t.team_count} teams</span>
                <span>{t.match_count} matches</span>
                {t.live_count > 0 && <Badge variant="live">{t.live_count} live</Badge>}
              </div>
              {admin && (
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(t); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {data && <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />}

      <TournamentForm open={formOpen} onOpenChange={setFormOpen} tournament={editing} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete tournament?"
        description="This removes all its teams, matches, and standings. This cannot be undone."
        onConfirm={async () => { if (deleteId) await del.mutateAsync(deleteId); }}
      />
    </div>
  );
}
