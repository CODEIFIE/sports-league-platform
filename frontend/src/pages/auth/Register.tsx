import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';
import { register as registerUser } from '@/services/auth';
import { apiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiquidBackground } from '@/components/LiquidBackground';

const schema = z.object({
  fullName: z.string().min(2, 'Name is too short'),
  email: z.string().email(),
  password: z.string().min(6, 'Min 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setLoading(true);
    try {
      await registerUser({ ...values, role: 'TOURNAMENT_ADMIN' });
      toast.success('Account created!');
      navigate('/app', { replace: true });
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <LiquidBackground />
      <motion.form initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        onSubmit={handleSubmit(onSubmit)} className="glass-strong w-full max-w-sm space-y-5 rounded-3xl p-8 ring-glow">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Trophy className="h-6 w-6 text-primary" /> <span className="text-gradient">SportsLeague</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Create account</h2>
          <p className="text-sm text-muted-foreground">Start managing tournaments</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}
