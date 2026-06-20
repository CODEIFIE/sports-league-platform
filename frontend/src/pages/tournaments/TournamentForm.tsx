import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { Sport, Tournament } from '@/types';

interface FormValues {
  name: string; sportId: string; format: string; status: string;
  location: string; startDate: string; endDate: string;
}

export function TournamentForm({
  open, onOpenChange, tournament,
}: { open: boolean; onOpenChange: (v: boolean) => void; tournament: Tournament | null }) {
  const qc = useQueryClient();
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => (await api.get<{ data: Sport[] }>('/tournaments/sports')).data.data,
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { name: '', sportId: '', format: 'ROUND_ROBIN', status: 'DRAFT', location: '', startDate: '', endDate: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: tournament?.name ?? '',
        sportId: tournament ? String(sports?.find((s) => s.name === tournament.sport)?.id ?? '') : '',
        format: tournament?.format ?? 'ROUND_ROBIN',
        status: tournament?.status ?? 'DRAFT',
        location: tournament?.location ?? '',
        startDate: tournament?.start_date ?? '',
        endDate: tournament?.end_date ?? '',
      });
    }
  }, [open, tournament, sports, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, sportId: Number(values.sportId) };
      return tournament
        ? api.patch(`/tournaments/${tournament.id}`, payload)
        : api.post('/tournaments', payload);
    },
    onSuccess: () => {
      toast.success(tournament ? 'Tournament updated' : 'Tournament created');
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tournament ? 'Edit Tournament' : 'New Tournament'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register('name', { required: true })} placeholder="University Cup 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Sport</Label>
              <Select value={watch('sportId')} onValueChange={(v) => setValue('sportId', v)}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {sports?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={watch('format')} onValueChange={(v) => setValue('format', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                  <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['DRAFT', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register('location')} placeholder="Main Campus" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{tournament ? 'Save changes' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
