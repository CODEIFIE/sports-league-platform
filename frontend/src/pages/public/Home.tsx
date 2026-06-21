import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy, Radio, ArrowRight, BarChart3, CalendarDays, ShieldCheck,
  Moon, Sun, GraduationCap, Users2,
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

const DEVELOPERS = [
  { name: 'Muhammad Afnan', roll: 'G1F24UBSCS070' },
  { name: 'Khurram Malik', roll: 'G1F24UBSCS079' },
  { name: 'Fraz Ali Ghumman', roll: 'G1F24UBSCS091' },
];

const SPORTS = [
  { emoji: '🏏', name: 'Cricket', desc: 'Ball-by-ball scoring · batsmen, bowlers, overs & full scorecard' },
  { emoji: '⚽', name: 'Football', desc: 'Goals, assists, cards & live match timeline' },
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
          <div className="glass flex h-14 items-center justify-between rounded-2xl px-3 sm:px-4">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[10px] font-extrabold text-primary-foreground shadow-[0_0_18px_-2px_rgba(190,30,60,0.7)]">UCP</span>
              <span className="hidden text-gradient sm:inline">UCP Sports League</span>
              <span className="text-gradient sm:hidden">UCP SL</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <a href="#sports" className="text-muted-foreground transition-colors hover:text-foreground">Sports</a>
              <a href="#team" className="text-muted-foreground transition-colors hover:text-foreground">Developers</a>
              <Link to="/scoreboard" className="text-muted-foreground transition-colors hover:text-foreground">Live Scores</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggle}>{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
              <Button asChild variant="outline" className="hidden glass sm:inline-flex"><Link to="/login">Sign in</Link></Button>
              <Button asChild><Link to="/scoreboard">Live</Link></Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="container relative px-4 pt-16 pb-12 text-center sm:pt-20 sm:pb-16">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs sm:text-sm">
          <GraduationCap className="h-4 w-4 text-primary" />
          University of Central Punjab · Gujranwala Campus
        </motion.div>

        <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
          UCP Sports League<br />
          <span className="text-gradient bg-[length:200%_auto] animate-gradient-pan">Management System</span>
        </motion.h1>

        <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          The official platform for UCP Gujranwala cricket & football tournaments — fixtures,
          manual live scoring, real broadcast-style scorecards, standings and player statistics.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 animate-glow-pulse px-6 text-base sm:px-7">
            <Link to="/scoreboard">View Live Scores <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 glass px-6 text-base sm:px-7">
            <Link to="/login">Admin Dashboard</Link>
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: 'Leagues', value: Number(c.tournaments ?? 0) },
            { label: 'Teams', value: Number(c.teams ?? 0) },
            { label: 'Players', value: Number(c.players ?? 0) },
            { label: 'Matches', value: Number(c.matches ?? 0) },
          ].map((s) => (
            <motion.div key={s.label} whileHover={{ y: -4 }} className="glass rounded-2xl p-4">
              <div className="text-2xl font-bold text-gradient sm:text-3xl"><AnimatedCounter to={s.value} /></div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== DEVELOPERS / ATTRIBUTION ===== */}
      <section id="team" className="container px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
            <Users2 className="h-4 w-4" /> Project Showcase
          </span>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">This project is developed by</h2>
          <p className="mt-2 text-muted-foreground">BS Computer Science · University of Central Punjab, Gujranwala</p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
          {DEVELOPERS.map((d, i) => (
            <motion.div
              key={d.roll}
              initial={{ opacity: 0, y: 40, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18, type: 'spring', stiffness: 90, damping: 14 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl glass p-7 text-center ring-glow"
            >
              {/* animated glow orb */}
              <div className="absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl transition-all duration-500 group-hover:bg-primary/50" />
              <motion.div
                className="relative mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(42_92%_50%)] text-2xl font-extrabold text-white shadow-lg"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
              >
                {d.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </motion.div>
              <h3 className="relative mt-5 text-xl font-extrabold">
                <span className="text-gradient bg-[length:200%_auto] animate-gradient-pan">{d.name}</span>
              </h3>
              <div className="relative mt-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm tracking-wide text-primary">
                {d.roll}
              </div>
              <div className="sheen pointer-events-none absolute inset-0" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* SPORTS */}
      <section id="sports" className="container px-4 py-16">
        <SectionTitle eyebrow="Two sports, done right" title="Cricket & Football" />
        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {SPORTS.map((s, i) => (
            <motion.div key={s.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }}
              className="sheen group relative overflow-hidden rounded-3xl glass p-8">
              <div className="text-6xl transition-transform duration-300 group-hover:scale-110">{s.emoji}</div>
              <h3 className="mt-4 text-2xl font-bold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl transition-all group-hover:bg-primary/40" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container px-4 py-16">
        <SectionTitle eyebrow="Built for the campus" title="Everything tournaments need" />
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarDays, title: 'Fixtures', desc: 'Round-robin & knockout schedules for every league.' },
            { icon: Radio, title: 'Manual Live Scoring', desc: 'Admins control every ball and goal — no automation.' },
            { icon: BarChart3, title: 'Standings & Stats', desc: 'Auto-calculated points, run rates and leaderboards.' },
            { icon: Trophy, title: 'Player of the Match', desc: 'Awarded automatically at the end of each game.' },
            { icon: ShieldCheck, title: 'Role-based Admin', desc: 'Secure dashboard for organizers & match officials.' },
            { icon: GraduationCap, title: 'UCP Branded', desc: 'Designed for the UCP Gujranwala sports identity.' },
          ].map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06 }} whileHover={{ y: -6 }}
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

      <footer className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[10px] font-extrabold text-primary-foreground">UCP</span>
          <p className="font-medium text-foreground">UCP Sports League Management System</p>
          <p>University of Central Punjab · Gujranwala Campus</p>
          <p className="text-xs">Developed by Muhammad Afnan, Khurram Malik & Fraz Ali Ghumman · © 2026</p>
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
