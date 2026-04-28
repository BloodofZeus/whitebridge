import type { ComponentType } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountManagement from "@/components/admin/account-management";
import TransferApproval from "@/components/admin/transfer-approval";
import AdminSupportTickets from "@/components/admin/admin-support-tickets";
import AuditLog from "@/components/admin/audit-log";
import InheritanceManagement from "@/components/admin/inheritance-management";
import NotificationManagement from "@/components/admin/notification-management";
import EmailConfiguration from "@/components/admin/email-configuration";
import AdminSettings from "@/components/admin/admin-settings";
import UserManagement from "@/pages/user-management";
import {
  Users, DollarSign, Clock, CreditCard,
  Bell, Mail, HeadphonesIcon, Shield, Settings,
  ArrowRightLeft, Gavel, Menu, X, LogOut,
  Building2, ChevronRight
} from "lucide-react";

const VALID_TABS = ['accounts','transfers','inheritance','notifications','email','support','users','audit','settings'] as const;
type Tab = typeof VALID_TABS[number];

const NAV_ITEMS: { tab: Tab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { tab: 'accounts',      label: 'Accounts',      Icon: CreditCard },
  { tab: 'transfers',     label: 'Transfers',     Icon: ArrowRightLeft },
  { tab: 'users',         label: 'Users',         Icon: Users },
  { tab: 'support',       label: 'Support',       Icon: HeadphonesIcon },
  { tab: 'notifications', label: 'Notifications', Icon: Bell },
  { tab: 'email',         label: 'Email Config',  Icon: Mail },
  { tab: 'inheritance',   label: 'Inheritance',   Icon: Gavel },
  { tab: 'audit',         label: 'Audit Log',     Icon: Shield },
  { tab: 'settings',      label: 'Settings',      Icon: Settings },
];

function getTabFromUrl(): Tab {
  if (typeof window === 'undefined') return 'accounts';
  const p = new URLSearchParams(window.location.search).get('tab') as Tab | null;
  return p && VALID_TABS.includes(p) ? p : 'accounts';
}

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromUrl);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keep activeTab in sync when user presses back/forward
  useEffect(() => {
    const sync = () => setActiveTab(getTabFromUrl());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigateTo = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    setLocation(`/admin?tab=${tab}`);
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", description: "Redirecting to login…", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 500);
    }
    if (!isLoading && user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "Admin privileges required.", variant: "destructive" });
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FF]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0A2D5E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#0A2D5E] font-medium">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const handleLogout = async () => {
    try { await fetch("/api/logout", { method: "POST" }); } catch {}
    window.location.href = "/";
  };

  const renderModule = () => {
    switch (activeTab) {
      case 'accounts':      return <AccountManagement />;
      case 'transfers':     return <TransferApproval />;
      case 'inheritance':   return <InheritanceManagement />;
      case 'notifications': return <NotificationManagement />;
      case 'email':         return <EmailConfiguration />;
      case 'support':       return <AdminSupportTickets />;
      case 'users':         return <UserManagement />;
      case 'audit':         return <AuditLog />;
      case 'settings':      return <AdminSettings />;
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: statsLoading ? '—' : String(stats?.users?.total ?? 0),
      sub: `${stats?.users?.newToday ?? 0} new today · ${stats?.users?.activeNow ?? 0} online`,
      Icon: Users,
      testId: 'text-total-users',
    },
    {
      label: 'Active Accounts',
      value: statsLoading ? '—' : String(stats?.accounts?.active ?? 0),
      sub: `${stats?.accounts?.frozen ?? 0} frozen · ${stats?.accounts?.closed ?? 0} closed`,
      Icon: CreditCard,
      testId: 'text-active-accounts',
    },
    {
      label: 'Pending Transfers',
      value: statsLoading ? '—' : String(stats?.transfers?.pending ?? 0),
      sub: `${stats?.transfers?.completed ?? 0} completed · ${stats?.transfers?.rejected ?? 0} rejected`,
      Icon: Clock,
      testId: 'text-pending-transfers',
    },
    {
      label: 'Total Balance',
      value: statsLoading ? '—' : `$${Number(stats?.accounts?.totalBalance ?? 0).toLocaleString()}`,
      sub: `Monthly vol: $${Number(stats?.transactions?.monthlyVolume ?? 0).toLocaleString()}`,
      Icon: DollarSign,
      testId: 'text-total-balance',
    },
  ];

  const activeItem = NAV_ITEMS.find(n => n.tab === activeTab);

  return (
    <div className="h-screen flex flex-col bg-[#F5F8FF] overflow-hidden">

      <header className="flex-shrink-0 bg-[#051A3E] shadow-lg z-50">
        <div className="bg-amber-600 text-amber-50 text-xs px-4 py-1 text-center font-medium tracking-wide">
          Admin Control Panel — Restricted Access
        </div>
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-md text-white hover:bg-white/10 transition-colors"
              onClick={() => setSidebarOpen(s => !s)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00C896] rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-[#051A3E]" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block leading-none">
                <span className="font-bold text-white">Finora</span>
                <span className="font-bold text-[#00C896]"> Bank</span>
                <span className="ml-2 text-[10px] font-semibold text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded">ADMIN</span>
              </div>
            </div>
          </div>

          {/* Centre: breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-sm text-blue-300">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">{activeItem?.label}</span>
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                {user.firstName?.[0]}
              </div>
              <span className="text-sm text-blue-200 font-medium hidden lg:block">
                {user.firstName} {user.lastName}
              </span>
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 border border-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-40
            w-60 flex-shrink-0 bg-[#051A3E] border-r border-white/10
            flex flex-col overflow-hidden
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Navigation</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {NAV_ITEMS.map(({ tab, label, Icon }) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  data-testid={`tab-${tab}`}
                  onClick={() => navigateTo(tab)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group
                    ${active
                      ? 'bg-[#00C896]/15 text-white border border-[#00C896]/20'
                      : 'text-blue-300 hover:bg-white/5 hover:text-white border border-transparent'}
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-[#00C896]' : 'text-blue-400 group-hover:text-blue-200'}`} />
                  <span className="truncate">{label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C896] flex-shrink-0" />}
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.firstName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-amber-400 text-[10px]">Administrator</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900" data-testid="text-admin-title">
                {activeItem?.label ?? 'Dashboard'}
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Finora Bank Administration
              </p>
            </div>

            {/* Stat cards — visible on accounts / transfers / users tabs */}
            {['accounts', 'transfers', 'users'].includes(activeTab) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {statCards.map(({ label, value, sub, Icon, testId }) => (
                  <Card key={label} className="bg-white border border-slate-200 shadow-none rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</CardTitle>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-2xl font-bold text-slate-900" data-testid={testId}>{value}</div>
                      <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Active module */}
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
