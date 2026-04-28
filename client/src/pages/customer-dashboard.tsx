import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CustomerNavbar from "@/components/ui/customer-navbar";
import CustomerOverview from "@/components/customer/customer-overview";
import AccountOverview from "@/components/customer/account-overview";
import CardManagement from "@/components/customer/card-management";
import TransferCenter from "@/components/customer/transfer-center";
import BillPayments from "@/components/customer/bill-payments";
import InvestmentDashboard from "@/components/customer/investment-dashboard";
import CustomerProfile from "@/components/customer/customer-profile";
import CustomerSupport from "@/components/customer/customer-support";
import NotificationsCenter from "@/components/notifications/notifications-center";
import InheritanceManagement from "@/components/customer/inheritance-management";
import {
  Home, Wallet, Send, BarChart3, User,
  MoreHorizontal, Bell, CreditCard, Receipt, Shield,
  HeadphonesIcon, X as CloseX
} from "lucide-react";

export default function CustomerDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showMore, setShowMore] = useState(false);

  const [activeView, setActiveView] = useState(() =>
    new URLSearchParams(window.location.search).get('view') || 'home'
  );

  useEffect(() => {
    const sync = () =>
      setActiveView(new URLSearchParams(window.location.search).get('view') || 'home');
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = useCallback((view: string) => {
    setActiveView(view);
    setLocation(`/dashboard?view=${view}`);
  }, [setLocation]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        toast({
          title: "Session expired",
          description: "Please sign in to continue.",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/login"), 500);
      }
      if (!isLoading && user?.role === 'admin') {
        setLocation("/admin");
      }
    }, 150);
    return () => clearTimeout(id);
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FF]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0A2D5E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#0A2D5E] font-medium">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderView = () => {
    const props = { onNavigate: navigate };
    switch (activeView) {
      case 'accounts':     return <AccountOverview {...props} />;
      case 'cards':        return <CardManagement {...props} />;
      case 'transfers':    return <TransferCenter {...props} />;
      case 'bills':        return <BillPayments {...props} />;
      case 'investments':  return <InvestmentDashboard {...props} />;
      case 'inheritance':  return <InheritanceManagement {...props} />;
      case 'notifications':return <NotificationsCenter {...props} />;
      case 'profile':      return <CustomerProfile {...props} />;
      case 'support':      return <CustomerSupport {...props} />;
      case 'home':
      default:             return <CustomerOverview {...props} />;
    }
  };

  const bottomNav = [
    { view: 'home',      Icon: Home,       label: 'Home' },
    { view: 'accounts',  Icon: Wallet,     label: 'Accounts' },
    { view: 'transfers', Icon: Send,       label: 'Transfer' },
    { view: 'cards',     Icon: CreditCard, label: 'Cards' },
    { view: 'bills',     Icon: Receipt,    label: 'Bills' },
  ];

  const moreNav = [
    { view: 'investments',  Icon: BarChart3,      label: 'Investments' },
    { view: 'profile',      Icon: User,           label: 'Profile' },
    { view: 'inheritance',  Icon: Shield,         label: 'Estate' },
    { view: 'notifications',Icon: Bell,           label: 'Notifications' },
    { view: 'support',      Icon: HeadphonesIcon, label: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col">
      <CustomerNavbar activeView={activeView} onNavigate={navigate} />

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="page-transition">
            {renderView()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden">
        <div className="flex items-center justify-around px-1 py-2">
          {bottomNav.map(({ view, Icon, label }) => {
            const active = activeView === view;
            return (
              <button
                key={view}
                onClick={() => { navigate(view); setShowMore(false); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-[#0A2D5E] bg-[#F0F4FF]' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : ''}`} />
                <span className={`text-[10px] font-medium`}>{label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[#00C896]" />}
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMore(m => !m)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              showMore || moreNav.some(n => n.view === activeView)
                ? 'text-[#0A2D5E] bg-[#F0F4FF]'
                : 'text-slate-500'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More overflow sheet — mobile only */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-[66px] left-0 right-0 bg-white border-t border-slate-200 shadow-lg rounded-t-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">More Options</p>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <CloseX className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreNav.map(({ view, Icon, label }) => {
                const active = activeView === view;
                return (
                  <button
                    key={view}
                    onClick={() => { navigate(view); setShowMore(false); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      active ? 'bg-[#F0F4FF] text-[#0A2D5E]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
