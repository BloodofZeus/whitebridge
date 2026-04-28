import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  PlusCircle, PoundSterling, TrendingDown, Lock, Unlock,
  XCircle, Search, Send, FileText, Users, CreditCard,
  CheckCircle2, AlertTriangle, ChevronDown, RefreshCw
} from "lucide-react";
import type { User, Account } from "@shared/schema";

const fmtGBP = (n: string | number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(n));

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    frozen: 'bg-blue-100 text-blue-700 border-blue-200',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
};

type ModalMode = 'credit' | 'debit' | 'status' | 'create' | null;

const EMAIL_TEMPLATES = [
  { id: 'none', label: '— Write custom message —', subject: '', body: '' },
  {
    id: 'welcome', label: 'Welcome to NorthBridge',
    subject: 'Welcome to NorthBridge Capital Bank Ltd.',
    body: 'Dear Customer,\n\nWelcome to NorthBridge Capital Bank Ltd. We are delighted to have you as a customer.\n\nYour account is now fully active and ready to use. You can log in to your online banking portal at any time to manage your finances.\n\nIf you have any questions, please do not hesitate to contact our customer services team on +44 800 555 0199.\n\nKind regards,\nCustomer Services\nNorthBridge Capital Bank Ltd.',
  },
  {
    id: 'security_review', label: 'Account Security Review',
    subject: 'Important: Your Account Security Review',
    body: 'Dear Customer,\n\nAs part of our ongoing commitment to keeping your account safe, we are conducting a routine security review.\n\nYour account has been flagged for additional verification. Please contact us as soon as possible on +44 800 555 0199 so we can complete this process.\n\nYour account access may be temporarily restricted until this review is complete.\n\nKind regards,\nSecurity Team\nNorthBridge Capital Bank Ltd.',
  },
  {
    id: 'doc_required', label: 'Documents Required',
    subject: 'Action Required: Documents Needed',
    body: 'Dear Customer,\n\nIn order to comply with UK anti-money laundering regulations, we are required to collect updated identification documents from you.\n\nPlease log in to your account and upload the requested documents at your earliest convenience, or visit your nearest NorthBridge branch.\n\nFailure to provide the required documents within 14 days may result in restrictions being placed on your account.\n\nKind regards,\nCompliance Team\nNorthBridge Capital Bank Ltd.',
  },
  {
    id: 'account_frozen', label: 'Account Frozen Notice',
    subject: 'Important: Your Account Has Been Temporarily Frozen',
    body: 'Dear Customer,\n\nWe regret to inform you that your account has been temporarily frozen as a precautionary measure.\n\nThis action has been taken to protect your funds. No debits or transfers can be processed while your account is in this status.\n\nPlease contact our team immediately on +44 800 555 0199 to resolve this matter.\n\nKind regards,\nAccount Services\nNorthBridge Capital Bank Ltd.',
  },
  {
    id: 'account_reactivated', label: 'Account Reactivated',
    subject: 'Your Account Has Been Reactivated',
    body: 'Dear Customer,\n\nWe are pleased to inform you that your NorthBridge account has been successfully reactivated and is now fully operational.\n\nYou may now use all account features, including transfers, payments, and withdrawals.\n\nIf you have any questions, please call us on +44 800 555 0199.\n\nKind regards,\nAccount Services\nNorthBridge Capital Bank Ltd.',
  },
  {
    id: 'statement_ready', label: 'Monthly Statement Available',
    subject: 'Your Monthly Statement Is Now Available',
    body: 'Dear Customer,\n\nYour latest account statement is now available to view in your online banking portal.\n\nPlease log in to review your recent transactions and ensure all activity on your account is correct. If you notice anything unusual, contact us immediately on +44 800 555 0199.\n\nKind regards,\nNorthBridge Capital Bank Ltd.',
  },
];

export default function AccountManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [createUserId, setCreateUserId] = useState('');
  const [createType, setCreateType] = useState('checking');
  const [createInitialBalance, setCreateInitialBalance] = useState('');

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState('none');

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"], retry: false,
  });
  const { data: accounts = [], isLoading: accountsLoading, refetch } = useQuery<Account[]>({
    queryKey: ["/api/admin/accounts"], retry: false,
  });

  const creditMutation = useMutation({
    mutationFn: ({ accountId, amount, description }: { accountId: string; amount: string; description: string }) =>
      apiRequest("POST", `/api/admin/accounts/${accountId}/credit`, { amount, description }),
    onSuccess: () => {
      toast({ title: "Account credited", description: `£${amount} added successfully.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setModalMode(null); setAmount(''); setDescription('');
    },
    onError: handleMutationError,
  });

  const debitMutation = useMutation({
    mutationFn: ({ accountId, amount, description }: { accountId: string; amount: string; description: string }) =>
      apiRequest("POST", `/api/admin/accounts/${accountId}/debit`, { amount, description }),
    onSuccess: () => {
      toast({ title: "Account debited", description: `£${amount} deducted successfully.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setModalMode(null); setAmount(''); setDescription('');
    },
    onError: handleMutationError,
  });

  const statusMutation = useMutation({
    mutationFn: ({ accountId, status, reason }: { accountId: string; status: string; reason: string }) =>
      apiRequest("POST", `/api/admin/accounts/${accountId}/status`, { status, reason }),
    onSuccess: () => {
      toast({ title: "Status updated", description: "Account status changed successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setModalMode(null); setNewStatus(''); setStatusReason('');
    },
    onError: handleMutationError,
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: { userId: string; accountType: string; initialBalance: string }) =>
      apiRequest("POST", "/api/admin/accounts/create", data),
    onSuccess: () => {
      toast({ title: "Account created", description: "New account opened successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setModalMode(null); setCreateUserId(''); setCreateType('checking'); setCreateInitialBalance('');
    },
    onError: handleMutationError,
  });

  const emailMutation = useMutation({
    mutationFn: ({ userIds, subject, message }: { userIds: string[]; subject: string; message: string }) =>
      apiRequest("POST", "/api/admin/email", { userIds, subject, message }),
    onSuccess: () => {
      toast({ title: "Email sent", description: `Message sent to ${selectedUsers.length} recipient(s).` });
      setEmailSubject(''); setEmailMessage(''); setSelectedUsers([]); setTemplateId('none');
    },
    onError: handleMutationError,
  });

  function handleMutationError(error: any) {
    if (isUnauthorizedError(error)) {
      toast({ title: "Session expired", description: "Redirecting to login…", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 500);
      return;
    }
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }

  const openModal = (mode: ModalMode, account?: Account) => {
    setSelectedAccount(account || null);
    setAmount(''); setDescription(''); setNewStatus(''); setStatusReason('');
    setModalMode(mode);
  };

  const onTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = EMAIL_TEMPLATES.find(t => t.id === id);
    if (t) { setEmailSubject(t.subject); setEmailMessage(t.body); }
  };

  const filtered = accounts.filter(acc => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const owner = users.find(u => u.id === acc.userId);
    return (
      acc.accountNumber?.toLowerCase().includes(q) ||
      acc.accountType?.toLowerCase().includes(q) ||
      acc.status?.toLowerCase().includes(q) ||
      `${owner?.firstName} ${owner?.lastName}`.toLowerCase().includes(q) ||
      owner?.email?.toLowerCase().includes(q)
    );
  });

  const isLoading = usersLoading || accountsLoading;

  return (
    <div className="space-y-6">

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', value: accounts.length, color: '#0A2D5E', Icon: CreditCard },
          { label: 'Active', value: accounts.filter(a => a.status === 'active').length, color: '#059669', Icon: CheckCircle2 },
          { label: 'Frozen', value: accounts.filter(a => a.status === 'frozen').length, color: '#d97706', Icon: AlertTriangle },
          { label: 'Closed', value: accounts.filter(a => a.status === 'closed').length, color: '#6b7280', Icon: XCircle },
        ].map(({ label, value, color, Icon }) => (
          <Card key={label} className="border-0 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: color }} />
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts"><CreditCard className="w-3.5 h-3.5 mr-1.5" />Accounts</TabsTrigger>
          <TabsTrigger value="operations"><PoundSterling className="w-3.5 h-3.5 mr-1.5" />Credit / Debit</TabsTrigger>
          <TabsTrigger value="email"><Send className="w-3.5 h-3.5 mr-1.5" />Message Customers</TabsTrigger>
        </TabsList>

        {/* ── ACCOUNTS TAB ── */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base">All Accounts</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      placeholder="Search accounts…"
                      className="pl-8 h-8 text-sm w-52"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#0A2D5E] hover:bg-[#0A2D5E]/90"
                    onClick={() => openModal('create')}
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    Open Account
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading accounts…</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No accounts found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['Account Number', 'Owner', 'Type', 'Balance', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(acc => {
                        const owner = users.find(u => u.id === acc.userId);
                        return (
                          <tr key={acc.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{acc.accountNumber}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900 text-xs">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</div>
                              <div className="text-slate-400 text-[11px]">{owner?.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="capitalize text-xs text-slate-600">{acc.accountType}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900 text-xs">{fmtGBP(acc.balance)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusBadge(acc.status)}`}>
                                {acc.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-2"
                                  onClick={() => openModal('credit', acc)}
                                >
                                  <PoundSterling className="w-3 h-3 mr-0.5" />Credit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 px-2"
                                  onClick={() => openModal('debit', acc)}
                                >
                                  <TrendingDown className="w-3 h-3 mr-0.5" />Debit
                                </Button>
                                {acc.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 px-2"
                                    onClick={() => { openModal('status', acc); setNewStatus('frozen'); }}
                                  >
                                    <Lock className="w-3 h-3 mr-0.5" />Freeze
                                  </Button>
                                )}
                                {acc.status === 'frozen' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-2"
                                    onClick={() => { openModal('status', acc); setNewStatus('active'); }}
                                  >
                                    <Unlock className="w-3 h-3 mr-0.5" />Unfreeze
                                  </Button>
                                )}
                                {acc.status !== 'closed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-slate-300 text-slate-600 hover:bg-slate-50 px-2"
                                    onClick={() => { openModal('status', acc); setNewStatus('closed'); }}
                                  >
                                    <XCircle className="w-3 h-3 mr-0.5" />Close
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CREDIT / DEBIT TAB ── */}
        <TabsContent value="operations">
          <Card>
            <CardHeader><CardTitle className="text-base">Credit or Debit an Account</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div>
                <Label>Select Account</Label>
                <Select onValueChange={v => setSelectedAccount(accounts.find(a => a.id === v) || null)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => {
                      const owner = users.find(u => u.id === acc.userId);
                      return (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.accountNumber} — {owner?.firstName} {owner?.lastName} ({fmtGBP(acc.balance)})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedAccount && (
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Balance</span>
                    <span className="font-semibold text-slate-900">{fmtGBP(selectedAccount.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className={`capitalize font-semibold ${selectedAccount.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>{selectedAccount.status}</span>
                  </div>
                </div>
              )}
              <div>
                <Label>Amount (£)</Label>
                <Input className="mt-1" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Description / Reference</Label>
                <Input className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Manual adjustment — admin approved" />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!selectedAccount || !amount || !description || creditMutation.isPending}
                  onClick={() => creditMutation.mutate({ accountId: selectedAccount!.id, amount, description })}
                >
                  <PoundSterling className="w-4 h-4 mr-1.5" />
                  {creditMutation.isPending ? 'Processing…' : 'Credit Account'}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={!selectedAccount || !amount || !description || debitMutation.isPending}
                  onClick={() => debitMutation.mutate({ accountId: selectedAccount!.id, amount, description })}
                >
                  <TrendingDown className="w-4 h-4 mr-1.5" />
                  {debitMutation.isPending ? 'Processing…' : 'Debit Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EMAIL TAB ── */}
        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle className="text-base">Send Message to Customers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Use a Template</Label>
                <Select value={templateId} onValueChange={onTemplateChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">You can edit the template text below before sending.</p>
              </div>
              <div>
                <Label>Subject</Label>
                <Input className="mt-1" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject line" />
              </div>
              <div>
                <Label>Message Body</Label>
                <Textarea
                  className="mt-1 font-mono text-sm"
                  rows={10}
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  placeholder="Write your message here…"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Recipients</Label>
                  <div className="flex gap-2">
                    <button
                      className="text-xs text-[#0A2D5E] underline"
                      onClick={() => setSelectedUsers(users.map(u => u.id))}
                    >Select all</button>
                    <button
                      className="text-xs text-slate-400 underline"
                      onClick={() => setSelectedUsers([])}
                    >Clear</button>
                  </div>
                </div>
                <div className="mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => setSelectedUsers(prev =>
                          prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                        )}
                        className="rounded border-gray-300 accent-[#C5003E]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {user.role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                className="w-full bg-[#0A2D5E] hover:bg-[#0A2D5E]/90"
                disabled={!emailSubject || !emailMessage || selectedUsers.length === 0 || emailMutation.isPending}
                onClick={() => emailMutation.mutate({ userIds: selectedUsers, subject: emailSubject, message: emailMessage })}
              >
                <Send className="w-4 h-4 mr-2" />
                {emailMutation.isPending ? 'Sending…' : `Send to ${selectedUsers.length} recipient${selectedUsers.length !== 1 ? 's' : ''}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── CREDIT MODAL ── */}
      <Dialog open={modalMode === 'credit'} onOpenChange={o => !o && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-emerald-700">Credit Account</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="text-sm text-slate-600 bg-emerald-50 rounded-lg p-3 mb-2">
              <strong>{selectedAccount.accountNumber}</strong> — Current Balance: <strong>{fmtGBP(selectedAccount.balance)}</strong>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Amount to Credit (£)</Label>
              <Input className="mt-1" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
            </div>
            <div>
              <Label>Description / Reference</Label>
              <Input className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Interest payment" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!amount || !description || creditMutation.isPending}
              onClick={() => selectedAccount && creditMutation.mutate({ accountId: selectedAccount.id, amount, description })}
            >
              {creditMutation.isPending ? 'Processing…' : `Credit £${amount || '0'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DEBIT MODAL ── */}
      <Dialog open={modalMode === 'debit'} onOpenChange={o => !o && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-red-700">Debit Account</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="text-sm text-slate-600 bg-red-50 rounded-lg p-3 mb-2">
              <strong>{selectedAccount.accountNumber}</strong> — Current Balance: <strong>{fmtGBP(selectedAccount.balance)}</strong>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Amount to Debit (£)</Label>
              <Input className="mt-1" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
            </div>
            <div>
              <Label>Description / Reference</Label>
              <Input className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Fee charge" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!amount || !description || debitMutation.isPending}
              onClick={() => selectedAccount && debitMutation.mutate({ accountId: selectedAccount.id, amount, description })}
            >
              {debitMutation.isPending ? 'Processing…' : `Debit £${amount || '0'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STATUS MODAL ── */}
      <Dialog open={modalMode === 'status'} onOpenChange={o => !o && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Change Account Status</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-2">
              <strong>{selectedAccount.accountNumber}</strong> — Current:
              <span className={`ml-1.5 capitalize font-semibold ${statusBadge(selectedAccount.status)}`}>{selectedAccount.status}</span>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (recommended)</Label>
              <Textarea className="mt-1" rows={3} value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="Provide a reason for this status change" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button
              className={newStatus === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : newStatus === 'frozen' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}
              disabled={!newStatus || statusMutation.isPending}
              onClick={() => selectedAccount && statusMutation.mutate({ accountId: selectedAccount.id, status: newStatus, reason: statusReason })}
            >
              {statusMutation.isPending ? 'Updating…' : `Set to ${newStatus || '…'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE ACCOUNT MODAL ── */}
      <Dialog open={modalMode === 'create'} onOpenChange={o => !o && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[#0A2D5E]">Open New Account</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 -mt-2 mb-1">Create a new bank account for an existing customer.</p>
          <div className="space-y-3">
            <div>
              <Label>Customer</Label>
              <Select value={createUserId} onValueChange={setCreateUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.role === 'customer').map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={createType} onValueChange={setCreateType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Current Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="business">Business Account</SelectItem>
                  <SelectItem value="isa">Cash ISA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opening Balance (£)</Label>
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                min="0"
                value={createInitialBalance}
                onChange={e => setCreateInitialBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button
              className="bg-[#0A2D5E] hover:bg-[#0A2D5E]/90"
              disabled={!createUserId || createAccountMutation.isPending}
              onClick={() => createAccountMutation.mutate({ userId: createUserId, accountType: createType, initialBalance: createInitialBalance || '0' })}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              {createAccountMutation.isPending ? 'Creating…' : 'Open Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
