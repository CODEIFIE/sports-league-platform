import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radio, Moon, Sun, Trophy, ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import { getSocket } from '@/services/socket';
import { useTheme } from '@/components/theme-provider';
import { MatchCard } from '@/components/MatchCard';
import { StandingsTable } from '@/components/StandingsTable';
import { LiquidBackground } from '@/components/LiquidBackground';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Match, Paginated, Standing, Tournament } from '@/types';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Scoreboard() {
  const { theme, toggle } = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentId, setTournamentId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-matches'],
    queryFn: async () => (await api.get<{ data: Match[] }>('/matches')).data.data,
    refetchInterval: 15_000,
  });
  useEffect(() => { if (data) setMatches(data); }, [data]);

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

  const live = matches.filter((m) => m.status === 'LIVE');
  useEffect(() => {
    const socket = getSocket();
    const onUpdate = (m: Match) => setMatches((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
    socket.on('match:update', onUpdate);
    live.forEach((m) => socket.emit('match:join', m.id));
    return () => {
      live.forEach((m) => socket.emit('match:leave', m.id));
      socket.off('match:update', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.map((m) => m.id).join(',')]);

  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 9);
  const completed = matches.filter((m) => m.status === 'COMPLETED').slice(0, 9);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <LiquidBackground />

      <header className="sticky top-0 z-30">
        <div className="container mt-4">
          <div className="glass flex h-14 items-center justify-between rounded-2xl px-4">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              <span className="text-gradient">SportsLeague</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggle}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button asChild variant="outline" className="glass"><Link to="/login">Admin</Link></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container space-y-12 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Live <span className="text-gradient">Scoreboard</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Real-time scores, fixtures & standings — updating as it happens.</p>
        </motion.div>

        {/* LIVE */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-destructive" style={{ animation: 'live-ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }} />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
            </span>
            Live Now
            {live.length > 0 && <Badge variant="live">{live.length}</Badge>}
          </h2>
          {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : live.length ? (
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {live.map((m) => (
                <motion.div key={m.id} variants={item} className="ring-glow rounded-2xl">
                  <MatchCard match={m} />
                </motion.div>
              ))}
            </motion.div>
          ) : <EmptyState title="No live matches right now" hint="Check back during match hours." />}
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            {upcoming.length ? (
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((m) => <motion.div key={m.id} variants={item}><MatchCard match={m} /></motion.div>)}
              </motion.div>
            ) : <p className="text-sm text-muted-foreground">No upcoming matches.</p>}

            <h2 className="pt-4 text-lg font-semibold">Recent Results</h2>
            {completed.length ? (
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="grid gap-4 sm:grid-cols-2">
                {completed.map((m) => <motion.div key={m.id} variants={item}><MatchCard match={m} /></motion.div>)}
              </motion.div>
            ) : <p className="text-sm text-muted-foreground">No completed matches yet.</p>}
          </section>

          <section>
            <Card className="sticky top-24">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Standings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={tournamentId} onValueChange={setTournamentId}>
                  <SelectTrigger><SelectValue placeholder="Select tournament" /></SelectTrigger>
                  <SelectContent>
                    {tournaments?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <StandingsTable rows={standings ?? []} />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          © 2026 SportsLeague · Live Scoring Platform
        </div>
      </footer>
    </div>
  );
}
