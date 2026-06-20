import { Card } from '@/components/ui/card';
import { initials } from '@/lib/utils';
import type { Match } from '@/types';

const STAGES: { key: string; label: string }[] = [
  { key: 'QUARTER', label: 'Quarterfinals' },
  { key: 'SEMI', label: 'Semifinals' },
  { key: 'FINAL', label: 'Final' },
];

function Side({ name, score, winner }: { name: string | null; score: number; winner: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 text-sm ${winner ? 'font-bold' : ''}`}>
      <span className="flex items-center gap-2 truncate">
        <span className="grid h-5 w-5 place-items-center rounded bg-muted text-[9px] font-semibold">{initials(name)}</span>
        <span className="truncate">{name ?? 'TBD'}</span>
      </span>
      <span className="tabular-nums">{score}</span>
    </div>
  );
}

export function Bracket({ matches }: { matches: Match[] }) {
  const byStage = (stage: string) => matches.filter((m) => m.bracket_stage === stage);
  const present = STAGES.filter((s) => byStage(s.key).length > 0);
  const stages = present.length ? present : STAGES;

  return (
    <div className="flex gap-6 overflow-x-auto scrollbar-thin pb-2">
      {stages.map((stage) => {
        const ms = byStage(stage.key);
        return (
          <div key={stage.key} className="flex min-w-[220px] flex-col justify-around gap-4">
            <p className="text-center text-xs font-semibold uppercase text-muted-foreground">{stage.label}</p>
            {ms.length === 0 && <p className="text-center text-xs text-muted-foreground">—</p>}
            {ms.map((m) => {
              const homeWin = m.status === 'COMPLETED' && m.home_score > m.away_score;
              const awayWin = m.status === 'COMPLETED' && m.away_score > m.home_score;
              return (
                <Card key={m.id} className="divide-y overflow-hidden">
                  <Side name={m.home_team} score={m.home_score} winner={homeWin} />
                  <Side name={m.away_team} score={m.away_score} winner={awayWin} />
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
