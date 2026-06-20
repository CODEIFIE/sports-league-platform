import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';

interface Results {
  tournaments: { id: number; name: string }[];
  teams: { id: number; name: string }[];
  players: { id: number; name: string; team_name: string }[];
  matches: { id: number; home_team: string; away_team: string }[];
}

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState<Results | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return; }
    const t = setTimeout(async () => {
      const { data } = await api.get('/search', { params: { q } });
      setRes(data.data);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path: string) => { setOpen(false); setQ(''); navigate(path); };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => res && setOpen(true)}
        placeholder="Search tournaments, teams, players…"
        className="pl-9"
      />
      {open && res && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
          {(['tournaments', 'teams', 'players', 'matches'] as const).map((group) =>
            res[group].length ? (
              <div key={group} className="border-b last:border-0 p-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">{group}</p>
                {res[group].map((item: any) => (
                  <button
                    key={`${group}-${item.id}`}
                    onClick={() =>
                      go(
                        group === 'tournaments' ? `/app/tournaments/${item.id}`
                        : group === 'matches' ? `/app/live/${item.id}`
                        : group === 'teams' ? `/app/teams`
                        : `/app/players`,
                      )
                    }
                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    {group === 'players' ? `${item.name} · ${item.team_name}`
                      : group === 'matches' ? `${item.home_team ?? 'TBD'} vs ${item.away_team ?? 'TBD'}`
                      : item.name}
                  </button>
                ))}
              </div>
            ) : null,
          )}
          {(['tournaments', 'teams', 'players', 'matches'] as const).every((g) => !res[g].length) && (
            <p className="p-4 text-center text-sm text-muted-foreground">No results</p>
          )}
        </div>
      )}
    </div>
  );
}
