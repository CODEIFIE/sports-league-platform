import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy, Radio, ArrowRight, BarChart3, CalendarDays, Zap, Globe,
  Moon, Sun, ShieldCheck, Sparkles,
} from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { LiquidBackground } from '@/components/LiquidBackground';
import { AnimatedCounter } from '@/components/shared';
import type { DashboardData } from '@/types';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 120, damping: 18 } }),
};

const SPORTS = [
  { emoji: '⚽', name: 'Football', desc: 'Goals · assists · cards', tint: 'from-emerald-500/20 to-green-500/5' },
  { emoji: '🏏', name: 'Cricket', desc: 'Runs · wickets · overs', tint: 'from-teal-500/20 to-emerald-500/5' },
  { emoji: '🏀', name: 'Basketball', desc: 'Points · fouls · brackets', tint: 'from-green-500/20 to-cyan-500/5' },
];

export default function Home() {
  const { theme, toggle } = useTheme();
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<{ data: DashboardData }>('/stats/dashboard')).data.data,
  });
  const c = data?.counts ?? {};

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <LiquidBackground />

      {/* NAV */}
      <header className="sticky top-0 z-30">
        <div className="container mt-4">
          <div className="glass flex h-14 items-center justify-between rounded-2xl px-4">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_-2px_rgba(16,185,129,0.7)]">S</span>
              <span className="text-gradient">SportsLeague</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <a href="#sports" className="text-muted-foreground transition-colors hover:text-foreground">Sports</a>
              <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</a>
              <Link to="/scoreboard" className="text-muted-foreground transition-colors hover:text-foreground">Live Scores</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggle}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex"><Link to="/login">Sign in</Link></Button>
              <Button asChild><Link to="/scoreboard">Live</Link></Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="container relative pt-20 pb-16 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400" style={{ animation: 'live-ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Real-time live scoring engine
        </motion.div>

        <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          Run tournaments.<br />
          <span className="text-gradient bg-[length:200%_auto] animate-gradient-pan">Score live. Crown champions.</span>
        </motion.h1>

        <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          The all-in-one platform for football, cricket & basketball — fixtures, real-time scoring,
          automatic standings, deep player stats, and a stunning public scoreboard.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 animate-glow-pulse px-7 text-base">
            <Link to="/scoreboard">Watch Live Scores <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base glass">
            <Link to="/login">Admin Dashboard</Link>
          </Button>
        </motion.div>

        {/* live counters */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Tournaments', value: Number(c.tournaments ?? 0) },
            { label: 'Teams', value: Number(c.teams ?? 0) },
            { label: 'Players', value: Number(c.players ?? 0) },
            { label: 'Matches', value: Number(c.matches ?? 0) },
          ].map((s, i) => (
            <motion.div key={s.label} whileHover={{ y: -4 }}
              className="glass rounded-2xl p-4">
              <div className="text-3xl font-bold text-gradient"><AnimatedCounter to={s.value} /></div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SPORTS */}
      <section id="sports" className="container py-16">
        <SectionTitle eyebrow="One platform" title="Built for every game" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SPORTS.map((s, i) => (
            <motion.div key={s.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }} whileHover={{ y: -8, rotate: -0.5 }}
              className={`sheen group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${s.tint} p-8 backdrop-blur-xl`}>
              <div className="text-6xl transition-transform duration-300 group-hover:scale-110">{s.emoji}</div>
              <h3 className="mt-4 text-2xl font-bold">{s.name}</h3>
              <p className="mt-1 text-muted-foreground">{s.desc}</p>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl transition-all group-hover:bg-primary/40" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container py-16">
        <SectionTitle eyebrow="Everything included" title="Powerful from kickoff to final whistle" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarDays, title: 'Smart Fixtures', desc: 'Auto round-robin & knockout brackets in a click.' },
            { icon: Radio, title: 'Live Scoring', desc: 'Update scores in real time — every viewer sees it instantly.' },
            { icon: BarChart3, title: 'Auto Standings', desc: 'Database triggers compute points, GD & stats automatically.' },
            { icon: Zap, title: 'Player Stats', desc: 'Leaderboards for scorers, assists, runs, wickets & more.' },
            { icon: ShieldCheck, title: 'Role-based Access', desc: 'Super admin, organizers, match officials & public viewers.' },
            { icon: Globe, title: 'Public Scoreboard', desc: 'A gorgeous live board fans can follow without logging in.' },
          ].map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.07 }} whileHover={{ y: -6 }}
              className="group glass rounded-2xl p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-inset ring-primary/20 transition-all group-hover:scale-110 group-hover:bg-primary/25">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="glass-strong relative overflow-hidden rounded-3xl p-12 text-center ring-glow">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mx-auto mt-4 max-w-xl text-3xl font-bold sm:text-4xl">Ready to run your tournament?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Spin up a league, invite teams, and go live in minutes.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Button asChild size="lg"><Link to="/login">Get Started <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="glass"><Link to="/scoreboard">See it Live</Link></Button>
          </div>
          <div className="blob left-1/4 top-0 h-40 w-40 animate-float" style={{ background: 'radial-gradient(circle, hsla(152,80%,50%,0.5), transparent 70%)' }} />
        </motion.div>
      </section>

      <footer className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <Trophy className="h-6 w-6 text-primary" />
          <p>SportsLeague Management & Live Scoring Platform</p>
          <p>© 2026 · Built for university & local tournaments</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
      <span className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
    </motion.div>
  );
}
