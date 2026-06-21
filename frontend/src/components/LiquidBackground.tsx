import { cn } from '@/lib/utils';

/**
 * Animated UCP-themed backdrop: a crimson/navy gradient mesh with slowly
 * drifting, blurred colour blobs. Purely decorative, sits behind content.
 */
export function LiquidBackground({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0 bg-mesh-ucp opacity-80" />
      <div className="blob left-[-10%] top-[-10%] h-[42vw] w-[42vw] animate-blob-drift"
        style={{ background: 'radial-gradient(circle, hsla(345,75%,42%,0.55), transparent 70%)' }} />
      <div className="blob right-[-8%] top-[10%] h-[36vw] w-[36vw] animate-float"
        style={{ background: 'radial-gradient(circle, hsla(42,90%,52%,0.4), transparent 70%)', animationDelay: '-4s' }} />
      <div className="blob bottom-[-12%] left-[20%] h-[40vw] w-[40vw] animate-blob-drift"
        style={{ background: 'radial-gradient(circle, hsla(345,70%,38%,0.5), transparent 70%)', animationDelay: '-8s' }} />
      <div className="blob right-[15%] bottom-[-6%] h-[28vw] w-[28vw] animate-float"
        style={{ background: 'radial-gradient(circle, hsla(222,55%,30%,0.45), transparent 70%)', animationDelay: '-2s' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
    </div>
  );
}
