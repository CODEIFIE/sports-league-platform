import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/store/auth';
import { logout } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials } from '@/lib/utils';

const LABELS: Record<string, string> = {
  app: 'Dashboard', tournaments: 'Tournaments', teams: 'Teams', players: 'Players',
  matches: 'Matches', live: 'Live Scoring', stats: 'Statistics', reports: 'Reports',
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const segments = useLocation().pathname.split('/').filter(Boolean);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-card/60 px-4 backdrop-blur-2xl">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            <span className={i === segments.length - 1 ? 'font-medium text-foreground' : ''}>
              {LABELS[seg] ?? seg}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:block"><GlobalSearch /></div>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(user?.fullName)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>{user?.fullName}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/">Public site</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
