// Minimal duration parser: "15m", "7d", "30s", "12h", or a plain ms number.
export default function ms(input: string | number): number {
  if (typeof input === 'number') return input;
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(String(input).trim());
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = (m[2] || 'ms') as 'ms' | 's' | 'm' | 'h' | 'd';
  const mult: Record<typeof unit, number> = { ms: 1, s: 1e3, m: 6e4, h: 3.6e6, d: 8.64e7 };
  return n * mult[unit];
}
