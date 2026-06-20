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
import type { Player, Team } from '@/types';

interface FormValues {
  teamId: string; name: string; jerseyNumber: string; position: string; age: string;
}

export function PlayerForm({
  open, onOpenChange, player, teams,
}: { open: boolean; onOpenChange: (v: boolean) => void; player: Player | null; teams: Team[] }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { teamId: '', name: '', jerseyNumber: '', position: '', age: '' },
  });
  let photoFile: File | undefined;

  useEffect(() => {
    if (open) reset({
      teamId: String(player?.team_id ?? teams[0]?.id ?? ''),
      name: player?.name ?? '',
      jerseyNumber: player?.jersey_number != null ? String(player.jersey_number) : '',
      position: player?.position ?? '',
      age: player?.age != null ? String(player.age) : '',
    });
  }, [open, player, teams, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      return player ? api.patch(`/players/${player.id}`, fd) : api.post('/players', fd);
    },
    onSuccess: () => {
      toast.success(player ? 'Player updated' : 'Player created');
      qc.invalidateQueries({ queryKey: ['players'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{player ? 'Edit Player' : 'New Player'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={watch('teamId')} onValueChange={(v) => setValue('teamId', v)}>
              <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register('name', { required: true })} placeholder="Player name" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Jersey #</Label><Input type="number" {...register('jerseyNumber')} /></div>
            <div className="space-y-2"><Label>Position</Label><Input {...register('position')} /></div>
            <div className="space-y-2"><Label>Age</Label><Input type="number" {...register('age')} /></div>
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => { photoFile = e.target.files?.[0]; }} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{player ? 'Save changes' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
