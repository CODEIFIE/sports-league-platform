/* Broadcast-style per-sport live panels for the Match Centre. State shape comes
   from the backend simulation engine (live socket) or matches.summary_json. */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const overs = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
const sr = (r: number, b: number) => (b ? ((r / b) * 100).toFixed(1) : '0.0');
const econ = (r: number, b: number) => (b ? (r / (b / 6)).toFixed(2) : '0.00');

function Ball({ v }: { v: string }) {
  const tone = v === 'W' ? 'bg-destructive text-destructive-foreground'
    : v === '4' ? 'bg-primary/20 text-primary'
    : v === '6' ? 'bg-[hsl(42_92%_50%)] text-black'
    : v === '0' ? 'bg-muted text-muted-foreground' : 'bg-secondary';
  return <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${tone}`}>{v}</span>;
}

export function CricketLive({ view }: { view: any }) {
  const bat = view.batting;
  if (!bat) return null;
  const striker = bat.batsmen[bat.strikerIdx];
  const nonStriker = bat.batsmen[bat.nonStrikerIdx];
  const bowler = view.bowling?.figures?.[view.bowling.currentBowlerId];
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="text-sm text-muted-foreground">{bat.teamName} batting</p>
            <p className="text-4xl font-bold tabular-nums">{bat.score}/{bat.wickets}
              <span className="ml-2 text-lg font-normal text-muted-foreground">({overs(bat.balls)} ov)</span></p>
          </div>
          <div className="text-right text-sm">
            {view.innings === 2 && <p className="font-medium text-primary">Target {view.target} · need {view.required} ({view.requiredRunRate} rpo)</p>}
            <p className="text-muted-foreground">CRR {view.currentRunRate}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">At the crease</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[striker, nonStriker].filter(Boolean).map((b: any, i) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="flex items-center gap-2 font-medium">
                  {i === 0 && <span className="text-primary">●</span>}{b.name}{i === 0 ? ' *' : ''}
                </span>
                <span className="tabular-nums text-sm">{b.runs} ({b.balls}) · {b.fours}×4 {b.sixes}×6 · SR {sr(b.runs, b.balls)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Bowling</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bowler && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="font-medium">{bowler.name}</span>
                <span className="tabular-nums text-sm">{overs(bowler.balls)}-{bowler.runs}-{bowler.wickets} · econ {econ(bowler.runs, bowler.balls)}</span>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs text-muted-foreground">This over</p>
              <div className="flex flex-wrap gap-1.5">
                {(view.thisOver ?? []).length ? view.thisOver.map((v: string, i: number) => <Ball key={i} v={v} />)
                  : <span className="text-sm text-muted-foreground">—</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Scorecard({ inn }: { inn: any }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{inn.teamName} — {inn.score}/{inn.wickets} ({inn.overs} ov)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <THead><TR><TH>Batter</TH><TH></TH><TH className="text-right">R</TH><TH className="text-right">B</TH><TH className="text-right">4s</TH><TH className="text-right">6s</TH><TH className="text-right">SR</TH></TR></THead>
          <TBody>
            {inn.batsmen.filter((b: any) => b.balls > 0 || b.out).map((b: any) => (
              <TR key={b.id}>
                <TD className="font-medium">{b.name}</TD>
                <TD className="text-xs text-muted-foreground">{b.out ? b.dismissal : 'not out'}</TD>
                <TD className="text-right tabular-nums font-semibold">{b.runs}</TD>
                <TD className="text-right tabular-nums">{b.balls}</TD>
                <TD className="text-right tabular-nums">{b.fours}</TD>
                <TD className="text-right tabular-nums">{b.sixes}</TD>
                <TD className="text-right tabular-nums">{sr(b.runs, b.balls)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Table>
          <THead><TR><TH>Bowler</TH><TH className="text-right">O</TH><TH className="text-right">R</TH><TH className="text-right">W</TH><TH className="text-right">Econ</TH></TR></THead>
          <TBody>
            {inn.bowlers.filter((b: any) => b.balls > 0).map((b: any) => (
              <TR key={b.id}>
                <TD className="font-medium">{b.name}</TD>
                <TD className="text-right tabular-nums">{overs(b.balls)}</TD>
                <TD className="text-right tabular-nums">{b.runs}</TD>
                <TD className="text-right tabular-nums font-semibold">{b.wickets}</TD>
                <TD className="text-right tabular-nums">{econ(b.runs, b.balls)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function CricketScorecards({ view }: { view: any }) {
  return (
    <div className="space-y-4">
      {view.firstInnings && <Scorecard inn={view.firstInnings} />}
      {view.secondInnings && <Scorecard inn={view.secondInnings} />}
    </div>
  );
}

export function FootballView({ view }: { view: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Goals</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {view.scorers?.length ? view.scorers.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>⚽ <b>{s.player}</b> <span className="text-muted-foreground">({s.team})</span></span>
              <Badge variant="outline">{s.minute}'</Badge>
            </div>
          )) : <p className="text-sm text-muted-foreground">No goals yet.</p>}
          {view.cards?.map((c: any, i: number) => (
            <div key={`c${i}`} className="flex items-center justify-between text-sm">
              <span>{c.type === 'RED' ? '🟥' : '🟨'} {c.player} <span className="text-muted-foreground">({c.team})</span></span>
              <Badge variant="outline">{c.minute}'</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Match stats</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StatBar label="Possession" home={view.possession?.home ?? 50} away={view.possession?.away ?? 50} suffix="%" />
          <StatBar label="Shots" home={view.shots?.home ?? 0} away={view.shots?.away ?? 0} />
        </CardContent>
      </Card>
    </div>
  );
}

export function BasketballView({ view }: { view: any }) {
  const top = Object.values(view.scorers ?? {}).sort((a: any, b: any) => b.points - a.points).slice(0, 6);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">By quarter</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Q</TH><TH className="text-right">{view.home?.name}</TH><TH className="text-right">{view.away?.name}</TH></TR></THead>
            <TBody>
              {view.quarters?.map((q: any) => (
                <TR key={q.q}><TD>Q{q.q}</TD><TD className="text-right tabular-nums">{q.home}</TD><TD className="text-right tabular-nums">{q.away}</TD></TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Top scorers</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {top.length ? top.map((p: any, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span><b>{p.name}</b> <span className="text-muted-foreground">({p.team})</span></span>
              <span className="font-semibold tabular-nums">{p.points} pts</span>
            </div>
          )) : <p className="text-sm text-muted-foreground">No scoring yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBar({ label, home, away, suffix = '' }: { label: string; home: number; away: number; suffix?: string }) {
  const total = home + away || 1;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span>{home}{suffix}</span><span className="text-muted-foreground">{label}</span><span>{away}{suffix}</span></div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-primary" style={{ width: `${(home / total) * 100}%` }} />
        <div className="bg-primary/50" style={{ width: `${(away / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function Commentary({ lines }: { lines: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Live Commentary</CardTitle></CardHeader>
      <CardContent>
        <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
          {lines?.length ? lines.map((c: any, i: number) => (
            <p key={i} className="border-l-2 border-primary/40 pl-3 text-sm">{c.t}</p>
          )) : <p className="text-sm text-muted-foreground">Commentary will appear here.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
