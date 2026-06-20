import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Radio, BarChart3, CalendarDays } from 'lucide-react';
import { login } from '@/services/auth';
import { apiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiquidBackground } from '@/components/LiquidBackground';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type Form = z.infer<typeof schema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname ?? '/app', { replace: true });
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <LiquidBackground />

      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_-2px_rgba(16,185,129,0.7)]"><Trophy className="h-5 w-5" /></span>
          <span className="text-gradient">SportsLeague</span>
        </Link>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-4xl font-extrabold leading-tight">Run tournaments<br /><span className="text-gradient">like a pro.</span></h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Live scoring, automatic standings, player stats and public scoreboards — all in one beautiful platform.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: Radio, t: 'Real-time live scoring' },
              { icon: BarChart3, t: 'Auto-calculated standings & stats' },
              { icon: CalendarDays, t: 'Round-robin & knockout fixtures' },
            ].map((f, i) => (
              <motion.div key={f.t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><f.icon className="h-4 w-4" /></div>
                <span className="text-sm font-medium">{f.t}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <p className="text-sm text-muted-foreground">© 2026 SportsLeague Platform</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <motion.form initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          onSubmit={handleSubmit(onSubmit)} className="glass-strong w-full max-w-sm space-y-5 rounded-3xl p-8 ring-glow">
          <div className="lg:hidden flex items-center gap-2 font-bold">
            <Trophy className="h-6 w-6 text-primary" /> <span className="text-gradient">SportsLeague</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">Access your admin dashboard</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@sportsleague.dev" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account? <Link to="/register" className="text-primary hover:underline">Register</Link>
          </p>
          <p className="rounded-xl bg-primary/10 p-3 text-center text-xs text-muted-foreground">
            Demo: admin@sportsleague.dev / Admin@123
          </p>
        </motion.form>
      </div>
    </div>
  );
}
