import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Account, Transaction } from "@shared/schema";

interface Props { onNavigate: (view: string) => void; }
const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

export default function AccountOverview({ onNavigate }: Props) {
  const [showBal, setShowBal] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({ queryKey: ["/api/accounts"], retry: false });
  const { data: transactions = [] } = useQuery<Transaction[]>({ queryKey: ["/api/transactions"], retry: false });

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getAccountTx = (accountId: string) =>
    transactions.filter(t => t.accountId === accountId).slice(0, 5);

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Accounts</h1>
          <p className="text-sm text-slate-500">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowBal(b => !b)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
        >
          {showBal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showBal ? 'Hide balances' : 'Show balances'}
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No accounts found</p>
        </div>
      ) : (
        accounts.map((acc: Account) => {
          const isChecking = acc.accountType === 'checking';
          const accTx = getAccountTx(acc.id);
          return (
            <div key={acc.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className={`px-6 py-5 text-white ${isChecking ? 'bank-card-gradient' : 'bg-gradient-to-r from-emerald-700 to-emerald-500'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wider capitalize">{acc.accountType} Account</p>
                    <p className="text-2xl font-bold mt-1">{showBal ? fmt(acc.balance) : '•••••••'}</p>
                    <p className="text-white/60 text-xs mt-0.5">Available balance</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-2.5">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-[10px] uppercase tracking-wider">Account Number</p>
                    <p className="text-white font-mono text-sm mt-0.5">••••{acc.accountNumber?.slice(-4)}</p>
                  </div>
                  <button onClick={() => copy(acc.accountNumber, acc.id)} className="flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors">
                    {copied === acc.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === acc.id ? 'Copied' : 'Copy full'}
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-xs">Routing #</p>
                  <p className="font-medium text-slate-800 mt-0.5 text-sm font-mono">{acc.routingNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Status</p>
                  <Badge className={`mt-0.5 text-[10px] border-0 ${acc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : acc.status === 'frozen' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {acc.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Type</p>
                  <p className="font-medium text-slate-800 mt-0.5 text-sm capitalize">{acc.accountType}</p>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Recent Activity</p>
                </div>
                {accTx.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {accTx.map((tx: Transaction) => (
                      <div key={tx.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate">{tx.description}</p>
                          <p className="text-xs text-slate-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 pb-5 flex gap-3">
                <Button onClick={() => onNavigate('transfers')} className="flex-1 bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-9">
                  <ArrowUpRight className="w-4 h-4 mr-1.5" /> Transfer
                </Button>
                <Button onClick={() => onNavigate('bills')} variant="outline" className="flex-1 border-[#0A2D5E] text-[#0A2D5E] text-sm h-9 hover:bg-[#F0F4FF]">
                  Pay Bill
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
