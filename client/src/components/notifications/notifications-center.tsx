import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Bell, CheckCheck, Trash2, AlertTriangle, Info,
  Shield, ArrowUpRight, DollarSign, User
} from 'lucide-react';
import type { Notification } from '@shared/schema';

interface Props { onNavigate: (view: string) => void; }

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'security': return { Icon: Shield, color: 'bg-red-50 text-red-500' };
    case 'transfer': return { Icon: ArrowUpRight, color: 'bg-blue-50 text-blue-600' };
    case 'alert': return { Icon: AlertTriangle, color: 'bg-amber-50 text-amber-500' };
    case 'payment': return { Icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' };
    default: return { Icon: Info, color: 'bg-slate-100 text-slate-500' };
  }
};

export default function NotificationsCenter({ onNavigate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/notifications/${id}/read`, {}).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest('PUT', '/api/notifications/mark-all-read', {}).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: 'All notifications marked as read' });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/notifications/${id}`).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
  });

  const filtered = filter === 'unread'
    ? notifications.filter(n => n.status === 'unread')
    : notifications;

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  if (isLoading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-xs text-[#0A2D5E] font-medium hover:text-[#00C896] transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${filter === f ? 'bg-white text-[#0A2D5E] shadow-sm' : 'text-slate-600'}`}
          >
            {f === 'unread' ? 'Unread' : 'All'}
            {f === 'unread' && unreadCount > 0 && (
              <span className="w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium text-slate-400">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-50">
          {filtered.map((n: Notification) => {
            const { Icon, color } = getNotifIcon(n.type);
            const isUnread = n.status === 'unread';
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${isUnread ? 'bg-[#F0F4FF]/40' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0" onClick={() => isUnread && markRead.mutate(n.id)}>
                  <div className="flex items-start gap-2">
                    <p className={`text-sm flex-1 ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    {isUnread && <div className="w-2 h-2 bg-[#0A2D5E] rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  {isUnread && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif.mutate(n.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
