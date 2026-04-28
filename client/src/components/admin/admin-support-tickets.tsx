import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  MessageCircle, Send, ArrowLeft, Search, Filter,
  CheckCircle2, Clock, RefreshCw
} from "lucide-react";
import type { SupportTicket, ChatMessage, User } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Open',        cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    cls: 'bg-emerald-100 text-emerald-700' },
  closed:      { label: 'Closed',      cls: 'bg-slate-100 text-slate-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Low',    cls: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', cls: 'bg-blue-100 text-blue-600' },
  high:   { label: 'High',   cls: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700' },
};

type TicketUpdate = Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo'>>;

export default function AdminSupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  const { data: allTickets = [], isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support/tickets"],
    refetchInterval: 5000,
    retry: false,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/admin/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
    refetchInterval: 3000,
    retry: false,
  });

  const { data: adminUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allCustomers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
    retry: false,
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      await apiRequest("POST", `/api/admin/support/tickets/${ticketId}/messages`, { message });
    },
    onSuccess: () => {
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets", selectedTicket?.id, "messages"] });
      toast({ title: "Reply sent" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "You are logged out", variant: "destructive" });
      } else {
        toast({ title: "Failed to send reply", variant: "destructive" });
      }
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: TicketUpdate }) => {
      await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}`, updates);
    },
    onSuccess: (_, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      if (selectedTicket) {
        setSelectedTicket(prev => prev ? { ...prev, ...updates } : null);
      }
      const label = updates.status ? `Status → ${updates.status}` : updates.priority ? `Priority → ${updates.priority}` : updates.assignedTo ? 'Ticket assigned' : 'Updated';
      toast({ title: label });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  // ─── Filter logic ────────────────────────────────────────────────────────
  const filteredTickets = allTickets.filter(t => {
    const matchSearch = !searchTerm ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus   = filterStatus   === 'all' || t.status   === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchCategory = filterCategory === 'all' || t.category === filterCategory;
    let matchDate = true;
    if (filterDate !== 'all' && t.createdAt) {
      const created = new Date(t.createdAt);
      const now = new Date();
      if (filterDate === 'today') {
        matchDate = created.toDateString() === now.toDateString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        matchDate = created >= weekAgo;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
        matchDate = created >= monthAgo;
      }
    }
    return matchSearch && matchStatus && matchPriority && matchCategory && matchDate;
  });

  const categories = Array.from(new Set(allTickets.map(t => t.category).filter(Boolean)));

  const stats = {
    open:        allTickets.filter(t => t.status === 'open').length,
    in_progress: allTickets.filter(t => t.status === 'in_progress').length,
    urgent:      allTickets.filter(t => t.priority === 'urgent').length,
    resolved:    allTickets.filter(t => t.status === 'resolved').length,
  };

  // ─── Detail view ─────────────────────────────────────────────────────────
  if (selectedTicket) {
    const sc = STATUS_CONFIG[selectedTicket.status] ?? { label: selectedTicket.status, cls: 'bg-slate-100 text-slate-500' };
    const pc = PRIORITY_CONFIG[selectedTicket.priority] ?? { label: 'Medium', cls: 'bg-blue-100 text-blue-600' };

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => setSelectedTicket(null)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 truncate">{selectedTicket.subject}</h2>
              <Badge className={`text-[10px] border-0 ${sc.cls}`}>{sc.label}</Badge>
              <Badge className={`text-[10px] border-0 ${pc.cls}`}>{pc.label}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              #{selectedTicket.id?.slice(0, 8)?.toUpperCase()} · {selectedTicket.category} ·{' '}
              {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        {(() => {
          const customer = allCustomers.find(u => u.id === selectedTicket.userId);
          if (!customer) return null;
          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0A2D5E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(customer.firstName?.[0] ?? customer.email[0]).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {customer.firstName || customer.lastName
                      ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
                      : 'Customer'}
                  </p>
                  <p className="text-xs text-slate-400">{customer.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {customer.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Controls</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <Select
                value={selectedTicket.status}
                onValueChange={v => updateTicketMutation.mutate({ ticketId: selectedTicket.id, updates: { status: v as SupportTicket['status'] } })}
              >
                <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Priority</label>
              <Select
                value={selectedTicket.priority ?? 'medium'}
                onValueChange={v => updateTicketMutation.mutate({ ticketId: selectedTicket.id, updates: { priority: v as SupportTicket['priority'] } })}
              >
                <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Assign To</label>
              <Select
                value={selectedTicket.assignedTo ?? 'unassigned'}
                onValueChange={v => updateTicketMutation.mutate({ ticketId: selectedTicket.id, updates: { assignedTo: v === 'unassigned' ? null : v } })}
              >
                <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {adminUsers.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.firstName || ''} {a.lastName || ''}{(!a.firstName && !a.lastName) ? a.email : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Customer's Request</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{selectedTicket.description}</p>
          </div>
        </div>

        {/* Chat thread */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-semibold text-slate-900 text-sm">Conversation</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-slate-400">Live · 3s refresh</p>
            </div>
          </div>

          <div className="p-4 space-y-3 min-h-[200px] max-h-[350px] overflow-y-auto">
            {messagesLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">No messages yet — start the conversation</p>
              </div>
            ) : (
              messages.map(msg => {
                const isAdmin = msg.isFromAdmin;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isAdmin
                        ? 'bg-[#0A2D5E] text-white rounded-tr-sm'
                        : 'bg-[#F0F4FF] text-slate-800 rounded-tl-sm'
                    }`}>
                      <p className="text-xs font-semibold mb-1 opacity-70">{isAdmin ? 'You (Admin)' : 'Customer'}</p>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className={`text-[10px] mt-1.5 ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 p-3 flex gap-2">
            <Textarea
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
              placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[56px] max-h-[120px] border-slate-200 text-sm resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && replyMessage.trim()) {
                  e.preventDefault();
                  sendReplyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage.trim() });
                }
              }}
            />
            <Button
              onClick={() => { if (replyMessage.trim()) sendReplyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage.trim() }); }}
              disabled={!replyMessage.trim() || sendReplyMutation.isPending}
              className="bg-[#0A2D5E] hover:bg-[#051A3E] self-end h-10 px-4"
            >
              {sendReplyMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Queue table ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Support Tickets</h2>
          <p className="text-sm text-slate-500">{allTickets.length} total · {stats.open} open</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-500">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open',        value: stats.open,        cls: 'bg-blue-50 text-blue-700' },
          { label: 'In Progress', value: stats.in_progress, cls: 'bg-amber-50 text-amber-700' },
          { label: 'Urgent',      value: stats.urgent,      cls: 'bg-red-50 text-red-700' },
          { label: 'Resolved',    value: stats.resolved,    cls: 'bg-emerald-50 text-emerald-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`${cls} rounded-2xl px-4 py-3 text-center`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-1 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search tickets…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9 pl-8 border-slate-200 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filteredTickets.length !== allTickets.length && (
          <p className="text-xs text-slate-400">Showing {filteredTickets.length} of {allTickets.length} tickets</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-14 text-center">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 font-medium">No tickets match your filters</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Subject / Description</span>
              <span>Category</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Created</span>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredTickets.map(t => {
                const sc = STATUS_CONFIG[t.status] ?? { label: t.status, cls: 'bg-slate-100 text-slate-500' };
                const pc = PRIORITY_CONFIG[t.priority] ?? { label: t.priority, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="w-full text-left hover:bg-slate-50 transition-colors"
                  >
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center gap-3 px-5 py-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.status === 'resolved' ? 'bg-emerald-50' : t.status === 'in_progress' ? 'bg-amber-50' : 'bg-blue-50'
                      }`}>
                        {t.status === 'resolved'
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : t.status === 'in_progress'
                          ? <Clock className="w-4 h-4 text-amber-600" />
                          : <MessageCircle className="w-4 h-4 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.subject}</p>
                        <p className="text-xs text-slate-400">{t.category} · {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Badge className={`text-[10px] border-0 ${sc.cls}`}>{sc.label}</Badge>
                        <Badge className={`text-[10px] border-0 ${pc.cls}`}>{pc.label}</Badge>
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 items-center px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{t.description?.slice(0, 60)}…</p>
                      </div>
                      <span className="text-xs text-slate-600 capitalize">{t.category || '—'}</span>
                      <Badge className={`text-[10px] border-0 w-fit ${sc.cls}`}>{sc.label}</Badge>
                      <Badge className={`text-[10px] border-0 w-fit ${pc.cls}`}>{pc.label}</Badge>
                      <span className="text-xs text-slate-400">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
