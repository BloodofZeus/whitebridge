import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Transfer, TransferChatMessage, AdminResponseTemplate } from "@shared/schema";
import {
  ShieldAlert, CheckCircle2, XCircle, Clock, DollarSign,
  MessageSquare, Send, ChevronRight, Zap
} from "lucide-react";

const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

const DEFAULT_TEMPLATES: AdminResponseTemplate[] = [
  { id: 't1', title: 'Identity Verification', message: 'Please provide a valid government-issued ID for verification.', category: 'verification', createdAt: new Date() },
  { id: 't2', title: 'SSN Required', message: 'Please provide your Social Security Number (SSN) to verify this transfer.', category: 'verification', createdAt: new Date() },
  { id: 't3', title: 'Additional Docs', message: 'Additional documentation is required. Please contact your branch directly.', category: 'verification', createdAt: new Date() },
  { id: 't4', title: 'Transfer Approved', message: 'Your transfer has been reviewed and approved. It will be completed shortly.', category: 'approval', createdAt: new Date() },
  { id: 't5', title: 'Transfer Denied', message: 'We were unable to process this transfer. Please contact support for further assistance.', category: 'rejection', createdAt: new Date() },
];

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${highlight ? 'font-bold text-[#0A2D5E] text-sm' : 'text-slate-800 font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

export default function TransferApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const selectedTransferRef = useRef<Transfer | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<TransferChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with selectedTransfer state (accessible inside WS closure)
  useEffect(() => {
    selectedTransferRef.current = selectedTransfer;
  }, [selectedTransfer]);

  const { data: pendingTransfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ["/api/admin/transfers/pending"],
    refetchInterval: 8000,
    retry: false,
  });

  const { data: templates = [] } = useQuery<AdminResponseTemplate[]>({
    queryKey: ["/api/admin/response-templates"],
    retry: false,
  });

  const allTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  // Fetch chat messages for selected transfer
  useEffect(() => {
    if (!selectedTransfer) { setChatMessages([]); return; }
    apiRequest('GET', `/api/transfers/${selectedTransfer.id}/chat`)
      .then(r => r.json())
      .then((msgs: TransferChatMessage[]) => setChatMessages(msgs))
      .catch(console.error);
  }, [selectedTransfer?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // WebSocket (admin fetches one-time token, then connects)
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
            if (data.type === 'transfer_flagged') {
              const t = data.transfer as Transfer & { customerName?: string };
              queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers/pending"] });
              toast({
                title: 'Transfer Flagged for Review',
                description: `${t.customerName || 'A customer'} submitted ${fmt(t.amount)} — security hold active.`,
                variant: 'destructive',
              });
            } else if (data.type === 'transfer_chat_new_message' || data.type === 'transfer_chat_message_sent') {
              const msg = data.message as TransferChatMessage;
              // Only append message if it belongs to the currently selected transfer
              if (data.transferId !== selectedTransferRef.current?.id) return;
              setChatMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
          } catch {}
        };
      })
      .catch(console.error);

    return () => {
      mounted = false;
      ws?.close();
    };
  }, []);

  const sendChatMessage = (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg || !selectedTransfer || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'transfer_chat_message',
      transferId: selectedTransfer.id,
      message: msg,
    }));
    if (!text) setChatInput('');
  };

  const approveMutation = useMutation({
    mutationFn: (transferId: string) =>
      apiRequest("PUT", `/api/transfers/${transferId}/resolve`, { action: 'approve' }),
    onSuccess: () => {
      toast({ title: "Transfer Approved", description: "Customer notified via email, SMS, and in-app notification." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers/pending"] });
      setSelectedTransfer(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) { window.location.href = "/api/login"; return; }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason: string }) =>
      apiRequest("PUT", `/api/transfers/${transferId}/resolve`, { action: 'reject', reason }),
    onSuccess: () => {
      toast({ title: "Transfer Rejected", description: "Customer has been notified with the rejection reason." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers/pending"] });
      setSelectedTransfer(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) { window.location.href = "/api/login"; return; }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const heldTransfers = pendingTransfers.filter(t => t.status === 'verification_required');
  const otherTransfers = pendingTransfers.filter(t => t.status !== 'verification_required');
  const allDisplayed = [...heldTransfers, ...otherTransfers];

  return (
    <>
      {/* Split Panel Dialog */}
      <Dialog
        open={!!selectedTransfer}
        onOpenChange={o => { if (!o) { setSelectedTransfer(null); setRejectionReason(""); } }}
      >
        <DialogContent className="max-w-4xl h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#0A2D5E] font-bold">Transfer Review</span>
                  {selectedTransfer?.status === 'verification_required' && (
                    <Badge className="bg-amber-500 text-white border-0 text-[10px]">SECURITY HOLD</Badge>
                  )}
                </div>
                {selectedTransfer && (
                  <p className="text-xs text-slate-500 font-normal">
                    {selectedTransfer.toAccountHolderName} · {fmt(selectedTransfer.amount)}
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel: Transfer Details + Actions */}
            <div className="w-[42%] border-r border-slate-100 overflow-y-auto px-5 py-5 space-y-5 flex-shrink-0 bg-slate-50/30">
              {selectedTransfer && (
                <>
                  <section>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Transfer Details</p>
                    <div className="bg-white rounded-xl border border-slate-100 px-4 py-2">
                      <InfoRow label="Amount" value={fmt(selectedTransfer.amount)} highlight />
                      {parseFloat(selectedTransfer.fee) > 0 && <InfoRow label="Fee" value={fmt(selectedTransfer.fee)} />}
                      {parseFloat(selectedTransfer.tax) > 0 && <InfoRow label="Tax" value={fmt(selectedTransfer.tax)} />}
                      <InfoRow label="Recipient" value={selectedTransfer.toAccountHolderName} />
                      {selectedTransfer.toAccountNumber && (
                        <InfoRow label="Account #" value={`••${selectedTransfer.toAccountNumber.slice(-4)}`} />
                      )}
                      {selectedTransfer.toBankName && <InfoRow label="Bank" value={selectedTransfer.toBankName} />}
                      {selectedTransfer.description && <InfoRow label="Memo" value={selectedTransfer.description} />}
                      {selectedTransfer.createdAt && (
                        <InfoRow label="Submitted" value={new Date(selectedTransfer.createdAt).toLocaleString()} />
                      )}
                    </div>
                  </section>

                  {(selectedTransfer.recipientEmail || selectedTransfer.recipientPhone) && (
                    <section>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Info</p>
                      <div className="bg-white rounded-xl border border-slate-100 px-4 py-2">
                        {selectedTransfer.recipientEmail && <InfoRow label="Email" value={selectedTransfer.recipientEmail} />}
                        {selectedTransfer.recipientPhone && <InfoRow label="Phone" value={selectedTransfer.recipientPhone} />}
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Actions</p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => approveMutation.mutate(selectedTransfer.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                      >
                        {approveMutation.isPending ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Approving…</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-2" />Approve & Complete Transfer</>
                        )}
                      </Button>

                      <Textarea
                        placeholder="Enter rejection reason…"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="h-20 text-sm border-slate-200 resize-none bg-white"
                      />
                      <Button
                        onClick={() => {
                          if (!rejectionReason.trim()) {
                            toast({ title: 'Reason required', description: 'Please enter a rejection reason.', variant: 'destructive' });
                            return;
                          }
                          rejectMutation.mutate({ transferId: selectedTransfer.id, reason: rejectionReason });
                        }}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 h-10"
                      >
                        {rejectMutation.isPending ? (
                          <><div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" /> Rejecting…</>
                        ) : (
                          <><XCircle className="w-4 h-4 mr-2" />Reject Transfer</>
                        )}
                      </Button>
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Right Panel: Live Chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0 bg-white">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Live Chat with Customer</span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <MessageSquare className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm">No messages yet</p>
                    <p className="text-slate-300 text-xs mt-1">Start the conversation with the customer</p>
                  </div>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.isFromAdmin
                        ? 'bg-[#0A2D5E] text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      <p className={`text-[10px] font-bold mb-0.5 ${msg.isFromAdmin ? 'text-blue-300' : 'text-slate-400'}`}>
                        {msg.isFromAdmin ? 'You (Security Agent)' : 'Customer'}
                      </p>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Reply Templates */}
              <div className="px-4 pt-3 pb-2 border-t border-slate-100 bg-white flex-shrink-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Quick Replies
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {allTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => sendChatMessage(tpl.message)}
                      title={tpl.message}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap ${
                        tpl.category === 'approval'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : tpl.category === 'rejection'
                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                            : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="flex gap-2 p-4 border-t border-slate-100 bg-white flex-shrink-0">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Type a message to the customer…"
                  className="h-10 text-sm border-slate-200 flex-1"
                />
                <Button
                  onClick={() => sendChatMessage()}
                  disabled={!chatInput.trim()}
                  className="h-10 bg-[#0A2D5E] hover:bg-[#051A3E] px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Transfer Queue */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="flex items-center gap-3 text-[#0A2D5E]">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#0A2D5E]" />
            </div>
            <span>Transfer Review Queue</span>
            {heldTransfers.length > 0 && (
              <Badge className="bg-red-500 text-white border-0 ml-auto animate-pulse">
                {heldTransfers.length} security hold{heldTransfers.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : allDisplayed.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
              <p className="text-slate-500 font-medium">All transfers reviewed</p>
              <p className="text-slate-400 text-sm mt-1">No pending transfers at this time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allDisplayed.map(transfer => {
                const isHeld = transfer.status === 'verification_required';
                return (
                  <div
                    key={transfer.id}
                    onClick={() => setSelectedTransfer(transfer)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      isHeld
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isHeld ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      {isHeld
                        ? <ShieldAlert className="w-5 h-5 text-amber-600" />
                        : <Clock className="w-5 h-5 text-slate-500" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {transfer.toAccountHolderName}
                        </p>
                        {isHeld && (
                          <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5 flex-shrink-0">
                            FLAGGED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {transfer.toAccountNumber ? `Acct ••${transfer.toAccountNumber.slice(-4)}` : 'External transfer'} ·{' '}
                        {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{fmt(transfer.amount)}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{transfer.status.replace(/_/g, ' ')}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
