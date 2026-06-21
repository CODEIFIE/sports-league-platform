import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trophy, Award, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api, apiError } from '@/services/api';
import { scoring } from '@/services/scoring';
import { getSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { initials } from '@/lib/utils';
import { CricketLive, CricketScorecards, FootballView, Commentary } from './matchViews';
import type { Match, Paginated, Player } from '@/types';

export default function LiveScoring() {
  const { id } = useParams();
  const matchId = Number(id);
  const qc = useQueryClient();
  const [live, setLive] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => (await api.get<{ data: Match & { summary: any; momName: string | null } }>(`/matches/${matchId}`)).data.data,
  });

  useEffect(() => {
    const s = getSocket();
    s.emit('match:join', matchId);
    const onState = (st: any) => setLive(st);
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['match', matchId] });
    s.on('match:state', onState); s.on('match:update', onUpdate);
    return () => { s.emit('match:leave', matchId); s.off('match:state', onState); s.off('match:update', onUpdate); };
  }, [matchId, qc]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    try { const r = await fn(); if (r?.data?.data) setLive(r.data.data); }
    catch (e) { toast.error(apiError(e)); } finally { setBusy(false); }
  };

  if (isLoading || !match) return <Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin text-muted-foreground" />;

  const sport = match.sport_code;
  const completed = match.status === 'COMPLETED';
  const live_ = match.status === 'LIVE';
  const view = live ?? match.summary;
  const momName = view?.mom?.name ?? match.momName;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm"><Link to="/app/live"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        <Badge variant={live_ ? 'live' : completed ? 'secondary' : 'outline'}>{live_ ? '● LIVE' : match.status}</Badge>
      </div>

      {/* Scoreboard header */}
      <Card>
        <CardContent className="relative grid grid-cols-3 items-center gap-2 py-6 sm:gap-4 sm:py-8">
          <div className="absolute inset-0 -z-10 bg-mesh-ucp opacity-30" />
          <TeamBlock name={match.home_team} />
          <div className="text-center">
            <div className="text-3xl font-bold tabular-nums sm:text-5xl">
              {match.home_score}{sport === 'CRICKET' && match.home_wickets != null ? `/${match.home_wickets}` : ''}
              <span className="mx-1 text-muted-foreground sm:mx-2">:</span>
              {match.away_score}{sport === 'CRICKET' && match.away_wickets != null ? `/${match.away_wickets}` : ''}
            </div>
            <p className="mt-1 truncate text-[10px] uppercase text-muted-foreground sm:text-xs">{match.tournament_name}</p>
            {view?.result && <p className="mt-1 text-xs font-semibold text-primary sm:text-sm">{view.result}</p>}
          </div>
          <TeamBlock name={match.away_team} />
        </CardContent>
      </Card>

      {completed && (momName || view?.result) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center gap-2 rounded-2xl p-5 text-center ring-glow sm:p-6">
          <Trophy className="h-7 w-7 text-primary" />
          <p className="text-base font-bold sm:text-lg">{view?.result}</p>
          {momName && <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Award className="h-4 w-4 text-gold" /> Player of the Match: <b className="text-foreground">{momName}</b>
            {view?.mom?.line && <span>· {view.mom.line}</span>}</p>}
        </motion.div>
      )}

      {/* SETUP (scheduled) */}
      {match.status === 'SCHEDULED' && (
        <SetupPanel match={match} busy={busy} onCricket={(t: number, o: number) => run(() => scoring.cricketSetup(matchId, t, o))}
          onFootball={() => run(() => scoring.footballSetup(matchId))} />
      )}

      {/* LIVE controls */}
      {live_ && sport === 'CRICKET' && view && (
        <CricketControls view={view} busy={busy} matchId={matchId} run={run} onEnd={() => setEndOpen(true)} />
      )}
      {live_ && sport === 'FOOTBALL' && view && (
        <FootballControls match={match} view={view} busy={busy} matchId={matchId} run={run} onEnd={() => setEndOpen(true)} />
      )}

      {/* Broadcast / final panels */}
      {view && (
        <>
          {sport === 'CRICKET' && (completed ? <CricketScorecards view={view} /> : <CricketLive view={view} />)}
          {sport === 'FOOTBALL' && <FootballView view={view} />}
          <Commentary lines={view.commentary ?? []} />
        </>
      )}

      <ConfirmDialog open={endOpen} onOpenChange={setEndOpen}
        title="End match?" description="Records the final result, Player of the Match and updates standings."
        confirmLabel="End match" onConfirm={() => run(() => scoring.endMatch(matchId))} />
    </div>
  );
}

function TeamBlock({ name }: { name: string | null }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-base font-bold text-primary ring-1 ring-inset ring-primary/20 sm:h-16 sm:w-16 sm:text-xl">{initials(name)}</div>
      <p className="mt-2 truncate text-sm font-semibold sm:text-base">{name ?? 'TBD'}</p>
    </div>
  );
}

function SetupPanel({ match, busy, onCricket, onFootball }: any) {
  const [batTeam, setBatTeam] = useState<string>('');
  const [overs, setOvers] = useState('6');
  if (match.sport_code === 'FOOTBALL') {
    return <Card><CardContent className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-muted-foreground">Start the match to begin recording goals and cards.</p>
      <Button onClick={onFootball} disabled={busy}><Flag className="h-4 w-4" /> Start Match</Button>
    </CardContent></Card>;
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Start innings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Which team bats first?</p>
          <div className="grid grid-cols-2 gap-2">
            {[[match.home_team_id, match.home_team], [match.away_team_id, match.away_team]].map(([tid, tn]: any) => (
              <Button key={tid} variant={batTeam === String(tid) ? 'default' : 'outline'} onClick={() => setBatTeam(String(tid))}>{tn}</Button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-28"><label className="text-sm text-muted-foreground">Overs</label>
            <Input type="number" min={1} max={50} value={overs} onChange={(e) => setOvers(e.target.value)} /></div>
          <Button className="flex-1" disabled={busy || !batTeam} onClick={() => onCricket(Number(batTeam), Number(overs))}>Start innings</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CricketControls({ view, busy, matchId, run, onEnd }: any) {
  const bat = view.batting;
  const notOut = bat.batsmen.filter((b: any) => !b.out && bat.batsmen.indexOf(b) !== bat.strikerIdx && bat.batsmen.indexOf(b) !== bat.nonStrikerIdx);
  const [newBat, setNewBat] = useState('');
  const [newBowl, setNewBowl] = useState('');

  if (view.needNewBatsman) {
    return <Card><CardHeader><CardTitle className="text-base">Wicket! Select next batsman</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Select value={newBat} onValueChange={setNewBat}><SelectTrigger className="flex-1"><SelectValue placeholder="Choose batsman" /></SelectTrigger>
          <SelectContent>{bat.batsmen.filter((b: any) => !b.out && !b.onCrease).map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select>
        <Button disabled={busy || !newBat} onClick={() => run(() => scoring.cricketBatsman(matchId, Number(newBat)))}>Confirm</Button>
      </CardContent></Card>;
  }
  if (view.needNewBowler) {
    return <Card><CardHeader><CardTitle className="text-base">Over complete — select new bowler</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Select value={newBowl} onValueChange={setNewBowl}><SelectTrigger className="flex-1"><SelectValue placeholder="Choose bowler" /></SelectTrigger>
          <SelectContent>{view.bowling.players.filter((p: any) => p.id !== view.bowling.currentBowlerId).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent></Select>
        <Button disabled={busy || !newBowl} onClick={() => run(() => scoring.cricketBowler(matchId, Number(newBowl)))}>Confirm</Button>
      </CardContent></Card>;
  }
  const ball = (o: any) => run(() => scoring.cricketBall(matchId, o));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Score this ball</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[0, 1, 2, 3, 4, 6].map((r) => (
            <Button key={r} variant="secondary" className="h-12 text-lg font-bold" disabled={busy} onClick={() => ball({ runs: r })}>{r}</Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="destructive" disabled={busy} onClick={() => ball({ wicket: true })}>Wicket</Button>
          <Button variant="outline" disabled={busy} onClick={() => ball({ extra: 'wide' })}>Wide</Button>
          <Button variant="outline" disabled={busy} onClick={() => ball({ extra: 'noball' })}>No ball</Button>
          <Button variant="ghost" disabled={busy} onClick={onEnd} className="text-destructive">End match</Button>
        </div>
        <Button variant="link" className="px-0 text-muted-foreground" disabled={busy} onClick={() => run(() => scoring.cricketEndInnings(matchId))}>End this innings →</Button>
      </CardContent>
    </Card>
  );
}

function FootballControls({ match, view, busy, matchId, run, onEnd }: any) {
  const [tab, setTab] = useState<'goal' | 'card' | null>(null);
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [player, setPlayer] = useState(''); const [assist, setAssist] = useState('none');
  const [minute, setMinute] = useState(String(view.minute || 0));
  const [cardType, setCardType] = useState<'YELLOW' | 'RED'>('YELLOW');
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
  const { data: players } = useQuery({
    queryKey: ['players', 'team', teamId],
    queryFn: async () => (await api.get<Paginated<Player>>('/players', { params: { teamId, limit: 50 } })).data.data,
    enabled: !!teamId,
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Match controls</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant={tab === 'goal' ? 'default' : 'secondary'} onClick={() => setTab(tab === 'goal' ? null : 'goal')}>⚽ Goal</Button>
          <Button variant={tab === 'card' ? 'default' : 'secondary'} onClick={() => setTab(tab === 'card' ? null : 'card')}>🟨 Card</Button>
          <Button variant="ghost" className="ml-auto text-destructive" onClick={onEnd}>End match</Button>
        </div>
        {tab && (
          <div className="space-y-3 rounded-xl border p-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={side} onValueChange={(v) => { setSide(v as any); setPlayer(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="home">{match.home_team}</SelectItem><SelectItem value="away">{match.away_team}</SelectItem></SelectContent>
              </Select>
              <Input type="number" placeholder="Minute" value={minute} onChange={(e) => setMinute(e.target.value)} />
            </div>
            <Select value={player} onValueChange={setPlayer}>
              <SelectTrigger><SelectValue placeholder={tab === 'goal' ? 'Scorer' : 'Player'} /></SelectTrigger>
              <SelectContent>{players?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            {tab === 'goal' ? (
              <Select value={assist} onValueChange={setAssist}>
                <SelectTrigger><SelectValue placeholder="Assist (optional)" /></SelectTrigger>
                <SelectContent><SelectItem value="none">No assist</SelectItem>{players?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Select value={cardType} onValueChange={(v) => setCardType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="YELLOW">Yellow</SelectItem><SelectItem value="RED">Red</SelectItem></SelectContent>
              </Select>
            )}
            <Button className="w-full" disabled={busy || !player} onClick={() => {
              if (tab === 'goal') run(() => scoring.footballGoal(matchId, { teamId, playerId: Number(player), assistId: assist === 'none' ? null : Number(assist), minute: Number(minute) }));
              else run(() => scoring.footballCard(matchId, { teamId, playerId: Number(player), type: cardType, minute: Number(minute) }));
              setTab(null); setPlayer('');
            }}>Add {tab}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
