import { useState, useEffect, useRef, type ComponentType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTransferSchema } from "@shared/schema";
import { z } from "zod";
import {
  Send, ArrowLeftRight, Clock, CheckCircle2, XCircle,
  AlertTriangle, ShieldAlert, MessageSquare, Lock
} from "lucide-react";
import type { Account, Transfer, TransferChatMessage } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface Props { onNavigate: (view: string) => void; }
const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

const transferFormSchema = insertTransferSchema.extend({
  amount: z.string().min(1, "Amount is required").refine(v => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive amount"),
  toAccountHolderName: z.string().min(1, "Recipient name is required"),
  toAccountNumber: z.string().min(1, "Account number is required"),
  recipientEmail: z.string().email("Valid email required"),
  recipientPhone: z.string().min(7, "Valid phone number required"),
});
type TxForm = z.infer<typeof transferFormSchema>;

const STATUS_CONFIG: Record<string, { icon: ComponentType<{ className?: string }>; label: string; cls: string }> = {
  pending:              { icon: Clock,         label: 'Pending',    cls: 'bg-amber-100 text-amber-700' },
  completed:            { icon: CheckCircle2,  label: 'Completed',  cls: 'bg-emerald-100 text-emerald-700' },
  failed:               { icon: XCircle,       label: 'Failed',     cls: 'bg-red-100 text-red-700' },
  rejected:             { icon: XCircle,       label: 'Rejected',   cls: 'bg-red-100 text-red-700' },
  verification_required:{ icon: AlertTriangle, label: 'On Hold',    cls: 'bg-orange-100 text-orange-700' },
};

// ── Transfer Progress Overlay ────────────────────────────────────────────────
interface HoldOverlayProps {
  transfer: Transfer;
  onResolved: (resolution: 'approved' | 'rejected', reason?: string) => void;
}

function HoldOverlay({ transfer, onResolved }: HoldOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [holdPoint] = useState(() => Math.floor(Math.random() * 31) + 50); // 50–80
  const [paused, setPaused] = useState(false);
  const [resolved, setResolved] = useState<'approved' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<TransferChatMessage[]>([]);
  const [wsUnavailable, setWsUnavailable] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll chat messages when WS is unavailable
  const { data: existingMessages = [] } = useQuery<TransferChatMessage[]>({
    queryKey: ['/api/transfers', transfer.id, 'chat'],
    retry: false,
    refetchInterval: wsUnavailable && !resolved ? 5000 : false,
  });

  // Poll transfer status when WS is unavailable
  const { data: polledStatus } = useQuery<{ status: string; rejectionReason?: string }>({
    queryKey: ['/api/transfers', transfer.id, 'status'],
    enabled: wsUnavailable && !resolved,
    refetchInterval: wsUnavailable && !resolved ? 5000 : false,
  });

  useEffect(() => {
    if (!polledStatus || resolved) return;
    if (polledStatus.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      setResolved('approved');
      toast({ title: 'Transfer Approved!', description: 'Your transfer has been verified and completed.' });
    } else if (polledStatus.status === 'rejected' || polledStatus.status === 'failed') {
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      setResolved('rejected');
      setRejectionReason(polledStatus.rejectionReason);
      toast({ title: 'Transfer Rejected', description: polledStatus.rejectionReason || 'Your transfer was rejected by our security team.', variant: 'destructive' });
    }
  }, [polledStatus, resolved, queryClient, toast]);

  useEffect(() => {
    if (existingMessages.length > 0) setChatMessages(existingMessages);
  }, [existingMessages]);

  // Animate progress bar
  useEffect(() => {
    if (paused || resolved) return;
    const id = setInterval(() => {
      setProgress(prev => {
        if (prev >= holdPoint) {
          clearInterval(id);
          setPaused(true);
          return holdPoint;
        }
        return Math.min(prev + 1, holdPoint);
      });
    }, 30);
    return () => clearInterval(id);
  }, [holdPoint, paused, resolved]);

  // Resolve animation
  useEffect(() => {
    if (!resolved) return;
    const id = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(id); return 100; }
        return prev + 2;
      });
    }, 20);
    return () => clearInterval(id);
  }, [resolved]);

  // WebSocket connection — fetch a one-time server token before connecting
  useEffect(() => {
    let mounted = true;
    let ws: WebSocket | null = null;

    fetch('/api/ws-token', { credentials: 'include' })
      .then(r => r.json())
      .then(({ token }: { token: string }) => {
        if (!mounted) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
        wsRef.current = ws;

        ws.onopen = () => ws!.send(JSON.stringify({ type: 'auth', token }));

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'transfer_chat_new_message' && data.transferId === transfer.id) {
              setChatMessages(prev => [...prev, data.message]);
            } else if (data.type === 'transfer_chat_message_sent' && data.transferId === transfer.id) {
              setChatMessages(prev => {
                const exists = prev.find(m => m.id === data.message.id);
                return exists ? prev : [...prev, data.message];
              });
            } else if (data.type === 'transfer_resolved' && data.transferId === transfer.id) {
              const res = data.resolution as 'approved' | 'rejected';
              queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
              setResolved(res);
              setRejectionReason(data.reason);
              if (res === 'approved') {
                toast({ title: 'Transfer Approved!', description: 'Your transfer has been verified and completed.' });
              } else {
                toast({ title: 'Transfer Rejected', description: data.reason || 'Your transfer was rejected by our security team.', variant: 'destructive' });
              }
            }
          } catch {}
        };

        ws.onclose = () => { if (mounted) setWsUnavailable(true); };
        ws.onerror = () => { if (mounted) setWsUnavailable(true); };
      })
      .catch(() => { if (mounted) setWsUnavailable(true); });

    return () => {
      mounted = false;
      ws?.close();
    };
  }, [transfer.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'transfer_chat_message',
        transferId: transfer.id,
        message: text,
      }));
      setChatInput('');
    } else {
      try {
        const res = await fetch(`/api/transfers/${transfer.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: text }),
        });
        if (res.ok) {
          const msg = await res.json();
          setChatMessages(prev => {
            const exists = prev.find(m => m.id === msg.id);
            return exists ? prev : [...prev, msg];
          });
          setChatInput('');
        }
      } catch {
        toast({ title: 'Message failed', description: 'Unable to send message. Please try again.', variant: 'destructive' });
      }
    }
  };

  const progressBg = resolved === 'approved' ? 'bg-emerald-500' : resolved === 'rejected' ? 'bg-red-500' : 'bg-[#0A2D5E]';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A2D5E] px-6 py-5 text-white text-center">
          <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
            {resolved === 'approved'
              ? <CheckCircle2 className="w-7 h-7 text-white" />
              : resolved === 'rejected'
                ? <XCircle className="w-7 h-7 text-white" />
                : <ShieldAlert className="w-7 h-7 text-[#0A2D5E]" />
            }
          </div>
          <h2 className="text-lg font-bold">
            {resolved === 'approved' ? 'Transfer Completed!' : resolved === 'rejected' ? 'Transfer Rejected' : 'Security Review'}
          </h2>
          <p className="text-blue-200 text-sm mt-1">
            {resolved === 'approved'
              ? `${fmt(transfer.amount)} sent successfully to ${transfer.toAccountHolderName}`
              : resolved === 'rejected'
                ? 'Your transfer was declined by the security team'
                : 'Our security team is reviewing your transfer'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Transfer Progress</span>
            <span className="text-xs font-bold text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {paused && !resolved && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Verification Required — Our security team is reviewing your transfer. Please wait or chat below.
              </p>
            </div>
          )}
        </div>

        {/* Live Chat Panel */}
        {paused && !resolved && (
          <div className="px-6 pb-5">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className={`w-2 h-2 rounded-full animate-pulse ${wsUnavailable ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {wsUnavailable ? 'Support Chat (auto-refreshing)' : 'Live Support Chat'}
                </span>
              </div>

              {/* Messages */}
              <div className="h-40 overflow-y-auto p-3 space-y-2 bg-white">
                {chatMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-slate-400">Waiting for a security agent to connect…</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.isFromAdmin
                          ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                          : 'bg-[#0A2D5E] text-white rounded-tr-none'
                      }`}
                    >
                      {msg.isFromAdmin && (
                        <p className="text-[10px] font-bold text-[#00C896] mb-0.5">Security Agent</p>
                      )}
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 border-t border-slate-100 bg-slate-50">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  className="h-9 text-sm border-slate-200 flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!chatInput.trim()}
                  size="sm"
                  className="h-9 bg-[#0A2D5E] hover:bg-[#051A3E] px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Resolved state actions */}
        {resolved && progress >= 100 && (
          <div className="px-6 pb-5">
            <Button
              onClick={() => onResolved(resolved, rejectionReason)}
              className={`w-full ${resolved === 'approved' ? 'bg-[#00C896] hover:bg-[#00a87c]' : 'bg-slate-700 hover:bg-slate-800'} text-white`}
            >
              {resolved === 'approved' ? 'View Transfer History' : 'Close'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Transfer Center ──────────────────────────────────────────────────────
export default function TransferCenter({ onNavigate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<'send' | 'history'>('send');
  const [holdTransfer, setHoldTransfer] = useState<Transfer | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({ queryKey: ["/api/accounts"], retry: false });
  const { data: transfers = [] } = useQuery<Transfer[]>({ queryKey: ["/api/transfers"], retry: false });

  const form = useForm<TxForm>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromAccountId: "", toAccountNumber: "", toAccountHolderName: "",
      amount: "", description: "", recipientEmail: "", recipientPhone: "",
    },
  });

  const sendTransfer = useMutation({
    mutationFn: (data: TxForm) =>
      apiRequest("POST", "/api/transfers", { ...data, amount: Number(data.amount) }).then(r => r.json()),
    onSuccess: (res: Transfer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      form.reset();
      if (res.status === 'verification_required') {
        setHoldTransfer(res);
      } else {
        toast({ title: "Transfer submitted!", description: `${fmt(res.amount || 0)} sent successfully.` });
        setTab('history');
      }
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Transfer failed", description: e.message }),
  });

  const handleResolved = (resolution: 'approved' | 'rejected') => {
    setHoldTransfer(null);
    queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    setTab('history');
  };

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <>
      {holdTransfer && user && (
        <HoldOverlay
          transfer={holdTransfer}
          onResolved={handleResolved}
        />
      )}

      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transfer Center</h1>
          <p className="text-sm text-slate-500">Send money between accounts or to others</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['send', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-[#0A2D5E] shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              {t === 'send' ? '↑ New Transfer' : '↓ History'}
            </button>
          ))}
        </div>

        {tab === 'send' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="bank-card-gradient px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">New Transfer</p>
                  <p className="text-blue-200 text-xs">Transfers processed within 1–3 business days</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => sendTransfer.mutate(d))} className="space-y-5">

                  <FormField control={form.control} name="fromAccountId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">From Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-slate-200">
                            <SelectValue placeholder="Select source account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              <span className="capitalize">{acc.accountType}</span> — ••{acc.accountNumber?.slice(-4)} ({fmt(acc.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="toAccountHolderName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Recipient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name of the recipient" className="h-11 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="toAccountNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Recipient Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" className="h-11 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Email & Phone side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="recipientEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">Recipient Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" className="h-11 border-slate-200" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="recipientPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">Recipient Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 555 000 0000" className="h-11 border-slate-200" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                          <Input placeholder="0.00" className="h-11 border-slate-200 pl-7" type="number" step="0.01" min="0" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Note / Memo <span className="text-slate-400 font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rent payment, monthly transfer..." className="h-11 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">All transfers are reviewed by our security team and may be placed on temporary hold. You will be notified via email, SMS, and in-app notification.</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold"
                    disabled={sendTransfer.isPending}
                  >
                    {sendTransfer.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </div>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Submit Transfer</>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Transfer History</h2>
            </div>
            {transfers.length === 0 ? (
              <div className="py-14 text-center">
                <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 font-medium">No transfers yet</p>
                <p className="text-slate-400 text-sm mt-1">Your transfer history will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {transfers.map(tx => {
                  const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${
                        tx.status === 'verification_required' ? 'border-l-4 border-l-amber-400 bg-amber-50/30' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls.split(' ')[0]}`}>
                        <StatusIcon className={`w-4.5 h-4.5 ${cfg.cls.split(' ')[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{tx.description || 'Transfer'}</p>
                        <p className="text-xs text-slate-400">
                          To: {tx.toAccountHolderName} · {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">−{fmt(tx.amount)}</p>
                        <Badge className={`text-[10px] border-0 ${cfg.cls}`}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
