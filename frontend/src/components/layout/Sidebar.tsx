import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, UserSquare2, CalendarDays,
  Radio, BarChart3, FileText, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/tournaments', label: 'Tournaments', icon: Trophy },
  { to: '/app/teams', label: 'Teams', icon: Users },
  { to: '/app/players', label: 'Players', icon: UserSquare2 },
  { to: '/app/matches', label: 'Matches', icon: CalendarDays },
  { to: '/app/live', label: 'Live Scoring', icon: Radio },
  { to: '/app/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/app/reports', label: 'Reports', icon: FileText },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-card/60 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground font-bold shadow-[0_0_18px_-2px_rgba(16,185,129,0.7)]">S</div>
        <span className="font-bold tracking-tight text-gradient">SportsLeague</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground shadow-[0_4px_20px_-4px_rgba(16,185,129,0.6)]'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:translate-x-1',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Globe className="h-4 w-4" />
          Public Site
        </NavLink>
      </div>
    </aside>
  );
}
