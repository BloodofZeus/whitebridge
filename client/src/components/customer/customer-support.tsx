import { useState, useRef, useEffect, type ComponentType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SupportTicket, ChatMessage } from "@shared/schema";
import {
  HeadphonesIcon, MessageCircle, Phone, Mail, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Send, ArrowLeft, Plus, ChevronDown, ChevronUp,
  CreditCard, Landmark, ArrowRightLeft, Shield, HelpCircle, Zap
} from "lucide-react";

interface Props { onNavigate: (view: string) => void; }

const ticketSchema = z.object({
  subject: z.string().min(3, "Subject required (min 3 chars)"),
  category: z.string().min(1, "Select category"),
  description: z.string().min(10, "Please describe your issue (min 10 chars)"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});
type TicketForm = z.infer<typeof ticketSchema>;

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Open',        cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    cls: 'bg-emerald-100 text-emerald-700' },
  closed:      { label: 'Closed',      cls: 'bg-slate-100 text-slate-600' },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Low',    cls: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', cls: 'bg-blue-100 text-blue-600' },
  high:   { label: 'High',   cls: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700' },
};

const CATEGORY_TILES: { id: string; label: string; Icon: ComponentType<{ className?: string }>; color: string; iconColor: string }[] = [
  { id: 'account',  label: 'Account Issue',      Icon: Landmark,        color: 'bg-slate-100', iconColor: 'text-[#0A2D5E]' },
  { id: 'transfer', label: 'Transfer / Payment', Icon: ArrowRightLeft,  color: 'bg-slate-100', iconColor: 'text-[#0A2D5E]' },
  { id: 'card',     label: 'Card Issue',          Icon: CreditCard,      color: 'bg-slate-100', iconColor: 'text-[#0A2D5E]' },
  { id: 'security', label: 'Security Concern',    Icon: Shield,          color: 'bg-slate-100', iconColor: 'text-[#0A2D5E]' },
  { id: 'loan',     label: 'Loans & Credit',      Icon: Zap,             color: 'bg-slate-100', iconColor: 'text-[#0A2D5E]' },
  { id: 'general',  label: 'General Inquiry',     Icon: HelpCircle,      color: 'bg-slate-100', iconColor: 'text-[#0A2D5E]' },
];

const FAQ_ITEMS = [
  { q: "How do I dispute a transaction?", a: "Log in, navigate to the transaction, and click 'Dispute'. Our team reviews all disputes within 2–3 business days." },
  { q: "How long do transfers take?",      a: "Internal transfers are instant. External transfers take 1–3 business days. Wire transfers process same-day if submitted before 3pm ET." },
  { q: "What if my card is lost or stolen?", a: "Immediately freeze your card in the Cards section, then contact us at 1-800-FINORA to report it and request a replacement." },
  { q: "Why is my transfer on hold?",      a: "Large or unusual transfers may be reviewed for your protection. You'll be notified once reviewed, typically within 1–2 business days." },
];

// ─── New Request Modal ────────────────────────────────────────────────────────
interface NewRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (ticket: SupportTicket) => void;
}

function NewRequestModal({ open, onOpenChange, onSuccess }: NewRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: '', category: '', description: '', priority: 'medium' },
  });

  const submitTicket = useMutation({
    mutationFn: (data: TicketForm) =>
      apiRequest("POST", "/api/support/tickets", data).then(r => r.json() as Promise<SupportTicket>),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      form.reset();
      setStep(1);
      setSelectedCategory('');
      onOpenChange(false);
      onSuccess(ticket);
      toast({ title: "Ticket submitted!", description: "Our team will respond shortly." });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    form.setValue('category', catId);
    setStep(2);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      form.reset();
      setStep(1);
      setSelectedCategory('');
    }
    onOpenChange(value);
  };

  const cat = CATEGORY_TILES.find(c => c.id === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {step === 1 ? 'New Support Request' : `New Request — ${cat?.label ?? ''}`}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {step === 1 ? 'Step 1 of 2 — Select a category' : 'Step 2 of 2 — Describe your issue'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {CATEGORY_TILES.map(({ id, label, Icon, color, iconColor }) => (
              <button
                key={id}
                onClick={() => handleCategorySelect(id)}
                className={`${color} rounded-xl p-4 text-left hover:scale-[1.02] active:scale-100 transition-all group`}
              >
                <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
                <p className="text-xs font-semibold text-slate-800 leading-snug">{label}</p>
                <ChevronRight className="w-3 h-3 text-slate-400 mt-1 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => submitTicket.mutate(d))} className="space-y-4 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to categories
              </button>

              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of your issue" className="h-10 border-slate-200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low — General inquiry</SelectItem>
                      <SelectItem value="medium">Medium — Standard issue</SelectItem>
                      <SelectItem value="high">High — Urgent matter</SelectItem>
                      <SelectItem value="urgent">Urgent — Critical issue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Describe your issue</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe in detail. Include dates, amounts, or account numbers that may be relevant."
                      className="min-h-[120px] border-slate-200 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 border-slate-200"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold"
                  disabled={submitTicket.isPending}
                >
                  {submitTicket.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </div>
                  ) : <><Send className="w-4 h-4 mr-1.5" /> Submit Ticket</>}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerSupport({ onNavigate }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<'home' | 'tickets' | 'detail'>('home');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    retry: false,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
    refetchInterval: 3000,
    retry: false,
  });

  useEffect(() => {
    if (view === 'detail') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const sendReply = useMutation({
    mutationFn: (msg: string) =>
      apiRequest("POST", `/api/support/tickets/${selectedTicket!.id}/messages`, { message: msg }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"] });
      setReplyMsg('');
    },
    onError: () => toast({ variant: "destructive", title: "Failed to send message" }),
  });

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const handleNewTicketSuccess = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  // ─── HOME ───────────────────────────────────────────────────────────────
  if (view === 'home') return (
    <div className="space-y-5">
      <NewRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleNewTicketSuccess}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Support</h1>
          <p className="text-sm text-slate-500">We're here to help — 24 hours a day, 7 days a week</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-9 px-4"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Request
        </Button>
      </div>

      {/* Quick contact bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Phone, label: '1-800-FINORA', sub: 'Mon–Fri 8am–8pm' },
          { Icon: Mail,  label: 'Live Chat',     sub: 'Open a ticket'   },
          { Icon: Clock, label: 'Avg Response',  sub: '< 2 hours'       },
        ].map(({ Icon, label, sub }) => (
          <div key={label} className="bg-slate-50 rounded-2xl p-3 text-center">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <Icon className="w-4 h-4 text-[#0A2D5E]" />
            </div>
            <p className="text-xs font-semibold text-[#0A2D5E]">{label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Category tiles — clicking opens the modal at step 1 */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="bank-card-gradient px-6 py-4">
          <p className="text-white font-semibold">What can we help you with?</p>
          <p className="text-blue-200 text-xs mt-0.5">Select a category to open a support ticket</p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORY_TILES.map(({ id, label, Icon, color, iconColor }) => (
            <button
              key={id}
              onClick={() => setModalOpen(true)}
              className={`${color} rounded-xl p-4 text-left hover:scale-[1.02] transition-all group`}
            >
              <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
              <p className="text-xs font-semibold text-slate-800">{label}</p>
              <ChevronRight className="w-3 h-3 text-slate-400 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent tickets */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-900">Your Tickets</p>
            <button onClick={() => setView('tickets')} className="text-xs text-[#0A2D5E] font-medium">View all →</button>
          </div>
          <div className="divide-y divide-slate-50">
            {tickets.slice(0, 3).map(t => {
              const sc = STATUS_CONFIG[t.status] ?? { label: t.status, cls: 'bg-slate-100 text-slate-600' };
              const pc = PRIORITY_CONFIG[t.priority] ?? { label: t.priority, cls: 'bg-slate-100 text-slate-600' };
              return (
                <button key={t.id} onClick={() => handleViewTicket(t)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-[#0A2D5E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.subject}</p>
                    <p className="text-xs text-slate-400">{t.category} · {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`text-[10px] border-0 ${sc.cls}`}>{sc.label}</Badge>
                    <Badge className={`text-[10px] border-0 ${pc.cls}`}>{pc.label}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#0A2D5E]" />
          <p className="font-semibold text-slate-900">Frequently Asked Questions</p>
        </div>
        <div className="divide-y divide-slate-50">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="px-5 py-4">
              <button className="w-full flex items-center justify-between text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <p className="text-sm font-medium text-slate-800 pr-2">{item.q}</p>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>
              {openFaq === i && <p className="text-sm text-slate-500 mt-3 leading-relaxed">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── TICKET LIST ─────────────────────────────────────────────────────────
  if (view === 'tickets') return (
    <div className="space-y-5">
      <NewRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleNewTicketSuccess}
      />
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">My Tickets</h1>
          <p className="text-sm text-slate-500">{tickets.length} total</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-9 px-4"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Request
        </Button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {ticketsLoading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="py-14 text-center">
            <HeadphonesIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 font-medium">No tickets yet</p>
            <Button onClick={() => setModalOpen(true)} variant="outline" className="mt-4 text-sm h-9">Open a Request</Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tickets.map(t => {
              const sc = STATUS_CONFIG[t.status] ?? { label: t.status, cls: 'bg-slate-100 text-slate-600' };
              const pc = PRIORITY_CONFIG[t.priority] ?? { label: t.priority, cls: 'bg-slate-100 text-slate-600' };
              return (
                <button key={t.id} onClick={() => handleViewTicket(t)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
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
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{t.description?.slice(0, 60)}…</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.category} · {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge className={`text-[10px] border-0 ${sc.cls}`}>{sc.label}</Badge>
                    <Badge className={`text-[10px] border-0 ${pc.cls}`}>{pc.label}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─── TICKET DETAIL + CHAT ─────────────────────────────────────────────────
  if (view === 'detail' && selectedTicket) {
    const sc = STATUS_CONFIG[selectedTicket.status] ?? { label: selectedTicket.status, cls: 'bg-slate-100 text-slate-600' };
    const pc = PRIORITY_CONFIG[selectedTicket.priority] ?? { label: selectedTicket.priority, cls: 'bg-slate-100 text-slate-600' };
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('tickets')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">{selectedTicket.subject}</h1>
            <p className="text-xs text-slate-500">Ticket #{selectedTicket.id?.slice(0, 8)?.toUpperCase()} · {selectedTicket.category}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge className={`text-[10px] border-0 ${sc.cls}`}>{sc.label}</Badge>
            <Badge className={`text-[10px] border-0 ${pc.cls}`}>{pc.label}</Badge>
          </div>
        </div>

        {/* Original description */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Your request</p>
          <p className="text-sm text-slate-700 leading-relaxed">{selectedTicket.description}</p>
          <p className="text-xs text-slate-400 mt-2">
            {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>

        {/* Chat thread */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-semibold text-slate-900 text-sm">Conversation</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-slate-400">Live</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-3 min-h-[200px] max-h-[320px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">No messages yet. Our team will respond shortly.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isAdmin = msg.isFromAdmin;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isAdmin
                        ? 'bg-[#F0F4FF] text-slate-800 rounded-tl-sm'
                        : 'bg-[#0A2D5E] text-white rounded-tr-sm'
                    }`}>
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {isAdmin ? 'Finora Support' : 'You'}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className={`text-[10px] mt-1.5 ${isAdmin ? 'text-slate-400' : 'text-blue-200'}`}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
            <div className="border-t border-slate-100 p-3 flex gap-2">
              <Input
                value={replyMsg}
                onChange={e => setReplyMsg(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 h-10 border-slate-200 text-sm"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && replyMsg.trim()) { e.preventDefault(); sendReply.mutate(replyMsg.trim()); } }}
              />
              <Button
                onClick={() => { if (replyMsg.trim()) sendReply.mutate(replyMsg.trim()); }}
                disabled={!replyMsg.trim() || sendReply.isPending}
                className="bg-[#0A2D5E] hover:bg-[#051A3E] h-10 px-4"
              >
                {sendReply.isPending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
