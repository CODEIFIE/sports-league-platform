import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiError } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Team, Tournament } from '@/types';

interface FormValues {
  tournamentId: string; name: string; coach: string; captain: string; contact: string;
}

export function TeamForm({
  open, onOpenChange, team, tournaments,
}: { open: boolean; onOpenChange: (v: boolean) => void; team: Team | null; tournaments: Tournament[] }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { tournamentId: '', name: '', coach: '', captain: '', contact: '' },
  });
  let logoFile: File | undefined;

  useEffect(() => {
    if (open) reset({
      tournamentId: String(team?.tournament_id ?? tournaments[0]?.id ?? ''),
      name: team?.name ?? '', coach: team?.coach ?? '', captain: team?.captain ?? '', contact: team?.contact ?? '',
    });
  }, [open, team, tournaments, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      return team ? api.patch(`/teams/${team.id}`, fd) : api.post('/teams', fd);
    },
    onSuccess: () => {
      toast.success(team ? 'Team updated' : 'Team created');
      qc.invalidateQueries({ queryKey: ['teams'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{team ? 'Edit Team' : 'New Team'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Tournament</Label>
            <Select value={watch('tournamentId')} onValueChange={(v) => setValue('tournamentId', v)}>
              <SelectTrigger><SelectValue placeholder="Select tournament" /></SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team name</Label>
            <Input {...register('name', { required: true })} placeholder="Engineering FC" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Coach</Label><Input {...register('coach')} /></div>
            <div className="space-y-2"><Label>Captain</Label><Input {...register('captain')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Contact</Label><Input {...register('contact')} /></div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <Input type="file" accept="image/*" onChange={(e) => { logoFile = e.target.files?.[0]; }} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{team ? 'Save changes' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
