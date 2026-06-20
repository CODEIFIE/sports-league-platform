import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Timer } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';

/**
 * Live match clock. Ticks locally while running, initialises from the match's
 * persisted minute_clock (seconds), and syncs back to the server periodically
 * so refreshing clients and the public scoreboard stay roughly in sync.
 */
export function MatchTimer({
  matchId, initialSeconds, active,
}: { matchId: number; initialSeconds: number; active: boolean }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(active);
  const lastSync = useRef(initialSeconds);

  useEffect(() => { setSeconds(initialSeconds); lastSync.current = initialSeconds; }, [initialSeconds]);
  useEffect(() => { if (!active) setRunning(false); }, [active]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // push to server every ~20s while running
  useEffect(() => {
    if (!running) return;
    if (seconds - lastSync.current >= 20) {
      lastSync.current = seconds;
      api.patch(`/matches/${matchId}/clock`, { seconds }).catch(() => {});
    }
  }, [seconds, running, matchId]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-lg font-semibold tabular-nums">{mm}:{ss}</span>
      {active && (
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => {
            const next = !running;
            setRunning(next);
            if (!next) api.patch(`/matches/${matchId}/clock`, { seconds }).catch(() => {});
          }}>
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}
