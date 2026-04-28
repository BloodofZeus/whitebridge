import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, Receipt, CreditCard, TrendingUp, User, HeadphonesIcon,
  Eye, EyeOff, Bell, ArrowUpRight, ArrowDownLeft, Shield,
  Wallet, ChevronRight, Plus, RefreshCw
} from "lucide-react";
import type { Account, Transaction, Card as BankCard, Notification } from "@shared/schema";

interface Props { onNavigate: (view: string) => void; }

const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(n));

export default function CustomerOverview({ onNavigate }: Props) {
  const { user } = useAuth();
  const [showBal, setShowBal] = useState(true);
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const { data: accounts = [], isLoading: accLoading } = useQuery<Account[]>({ queryKey: ["/api/accounts"], retry: false });
  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({ queryKey: ["/api/transactions"], retry: false });
  const { data: cards = [] } = useQuery<BankCard[]>({ queryKey: ["/api/cards"], retry: false });
  const { data: notifications = [] } = useQuery<Notification[]>({ queryKey: ["/api/notifications"], retry: false });

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance ?? 0), 0);
  const unread = (notifications as Notification[]).filter(n => n.status === 'unread').length;
  const primaryCard = cards.find(c => c.status === 'active') || cards[0];
  const checkingAcc = accounts.find(a => a.accountType === 'checking') || accounts[0];
  const savingsAcc = accounts.find(a => a.accountType === 'savings');

  const filtered = transactions.filter(t =>
    txFilter === 'all' ? true : t.type === txFilter
  ).slice(0, 6);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const QuickActions = [
    { label: 'Transfer',  view: 'transfers',   Icon: Send        },
    { label: 'Pay Bills', view: 'bills',        Icon: Receipt     },
    { label: 'Cards',     view: 'cards',        Icon: CreditCard  },
    { label: 'Invest',    view: 'investments',  Icon: TrendingUp  },
  ];

  if (accLoading || txLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{greeting},</p>
          <h1 className="text-xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</h1>
        </div>
        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Balance hero card */}
      <div className="relative bank-card-gradient rounded-2xl p-6 text-white overflow-hidden shadow-lg">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Total Balance</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold">
                  {showBal ? fmt(totalBalance) : '•••••••'}
                </span>
                <button onClick={() => setShowBal(b => !b)} className="text-blue-200 hover:text-white transition-colors">
                  {showBal ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold bg-white/20 rounded px-2 py-1 inline-block tracking-wide">NORTHBRIDGE</div>
              <p className="text-blue-200 text-xs mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Mini account cards */}
          <div className="flex gap-3">
            {checkingAcc && (
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-blue-200 text-[10px] uppercase tracking-wide font-medium">Checking</p>
                <p className="text-white font-bold text-sm mt-0.5">
                  {showBal ? fmt(checkingAcc.balance) : '•••••'}
                </p>
                <p className="text-blue-300 text-[10px] mt-0.5">
                  ••{checkingAcc.accountNumber?.slice(-4)}
                </p>
              </div>
            )}
            {savingsAcc && (
              <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-blue-200 text-[10px] uppercase tracking-wide font-medium">Savings</p>
                <p className="text-white font-bold text-sm mt-0.5">
                  {showBal ? fmt(savingsAcc.balance) : '•••••'}
                </p>
                <p className="text-blue-300 text-[10px] mt-0.5">
                  ••{savingsAcc.accountNumber?.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {QuickActions.map(({ label, view, Icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 hover:border-[#0A2D5E]/20 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0A2D5E] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-medium text-slate-700">{label}</span>
          </button>
        ))}
      </div>

      {/* Account cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.slice(0, 2).map(acc => (
          <button
            key={acc.id}
            onClick={() => onNavigate('accounts')}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-4 hover:border-[#0A2D5E]/20 hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
              <Wallet className="w-5 h-5 text-[#0A2D5E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 capitalize">{acc.accountType}</p>
              <p className="font-semibold text-slate-900 text-sm">
                {showBal ? fmt(acc.balance) : '•••••'}
              </p>
              <p className="text-xs text-slate-400">••{acc.accountNumber?.slice(-4)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0A2D5E] transition-colors" />
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs text-[#C5003E] font-medium hover:text-[#9E0031] transition-colors"
          >
            See all
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-2">
          {(['all', 'credit', 'debit'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTxFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                txFilter === f
                  ? 'bg-[#0A2D5E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No transactions found</div>
          ) : (
            filtered.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                  {tx.type === 'credit'
                    ? <ArrowDownLeft className="w-4.5 h-4.5 text-[#0A2D5E]" />
                    : <ArrowUpRight className="w-4.5 h-4.5 text-[#0A2D5E]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* More services */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">More Services</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { view: 'investments',   label: 'Invest',  Icon: TrendingUp     },
            { view: 'support',       label: 'Support', Icon: HeadphonesIcon },
            { view: 'inheritance',   label: 'Estate',  Icon: Shield         },
            { view: 'profile',       label: 'Profile', Icon: User           },
            { view: 'notifications', label: 'Alerts',  Icon: Bell           },
            { view: 'cards',         label: 'Cards',   Icon: CreditCard     },
          ].map(({ view, label, Icon }) => (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0A2D5E] flex items-center justify-center">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-medium text-slate-600">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
