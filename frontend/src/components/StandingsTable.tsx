import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/shared';
import { initials } from '@/lib/utils';
import type { Standing } from '@/types';

export function StandingsTable({ rows }: { rows: Standing[] }) {
  if (!rows.length) return <EmptyState title="No standings yet" hint="Standings appear once matches are completed." />;
  return (
    <Table>
      <THead>
        <TR>
          <TH className="w-8">#</TH><TH>Team</TH>
          <TH className="text-center">P</TH><TH className="text-center">W</TH>
          <TH className="text-center">D</TH><TH className="text-center">L</TH>
          <TH className="text-center">GF</TH><TH className="text-center">GA</TH>
          <TH className="text-center">GD</TH><TH className="text-center font-bold">Pts</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={r.team_id}>
            <TD className="text-muted-foreground">{i + 1}</TD>
            <TD>
              <div className="flex items-center gap-2">
                {r.logo_url
                  ? <img src={r.logo_url} className="h-6 w-6 rounded object-cover" alt="" />
                  : <div className="grid h-6 w-6 place-items-center rounded bg-muted text-[10px] font-semibold">{initials(r.team_name)}</div>}
                <span className="font-medium">{r.team_name}</span>
              </div>
            </TD>
            <TD className="text-center">{r.played}</TD>
            <TD className="text-center text-success">{r.wins}</TD>
            <TD className="text-center">{r.draws}</TD>
            <TD className="text-center text-destructive">{r.losses}</TD>
            <TD className="text-center">{r.goals_for}</TD>
            <TD className="text-center">{r.goals_against}</TD>
            <TD className="text-center">{r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff}</TD>
            <TD className="text-center font-bold">{r.points}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
