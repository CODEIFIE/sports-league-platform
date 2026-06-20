import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <p className="text-lg text-muted-foreground">This page could not be found.</p>
      <Button asChild><Link to="/">Back home</Link></Button>
    </div>
  );
}
