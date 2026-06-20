import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import type { AppNotification } from '@/types';

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setItems(data.data)).catch(() => {});
    const socket = getSocket();
    const handler = (n: any) => {
      setItems((prev) => [{ ...n, is_read: 0, created_at: n.createdAt ?? new Date().toISOString() }, ...prev].slice(0, 30));
      toast(n.title, { description: n.body ?? undefined });
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto" onClick={markAll}>Mark all read</Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {items.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>}
          {items.map((n) => (
            <div key={n.id} className="rounded-md p-2 hover:bg-accent">
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.created_at)}</p>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
