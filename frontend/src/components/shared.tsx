import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PageHeader({
  title, subtitle, action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label, value, icon: Icon, accent, index = 0,
}: { label: string; value: React.ReactNode; icon: React.ElementType; accent?: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-[0_16px_44px_-16px_rgba(190,30,60,0.5)]"
    >
      {/* glow orb */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl transition-all duration-500 group-hover:bg-primary/35" />
      <div className="relative flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn('rounded-xl p-2.5 ring-1 ring-inset ring-white/10', accent ?? 'bg-primary/15 text-primary')}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-3 text-3xl font-bold tabular-nums">{value}</div>
    </motion.div>
  );
}

/** Count-up number animation for hero stats. */
export function AnimatedCounter({ to, suffix = '', duration = 1.4 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span className="tabular-nums">{val.toLocaleString()}{suffix}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/50" />
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Pagination({
  page, pages, onChange,
}: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
