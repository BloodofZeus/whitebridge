import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Home, Wallet, Send, BarChart3, User, Bell,
  CreditCard, Receipt, Shield, HeadphonesIcon,
  Menu, X, ChevronDown, LogOut, Settings,
  Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerNavbarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const NAV_LINKS = [
  { view: 'home',      label: 'Overview',    Icon: Home },
  { view: 'accounts',  label: 'Accounts',    Icon: Wallet },
  { view: 'transfers', label: 'Transfers',   Icon: Send },
  { view: 'bills',     label: 'Bill Pay',    Icon: Receipt },
  { view: 'cards',     label: 'Cards',       Icon: CreditCard },
  { view: 'investments',label: 'Investing',  Icon: BarChart3 },
];

const MORE_LINKS = [
  { view: 'inheritance', label: 'Estate Planning', Icon: Shield },
  { view: 'support',    label: 'Support',          Icon: HeadphonesIcon },
  { view: 'notifications',label: 'Notifications',  Icon: Bell },
  { view: 'profile',    label: 'Profile',          Icon: User },
];

export default function CustomerNavbar({ activeView, onNavigate }: CustomerNavbarProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-[#0A2D5E] shadow-lg">
      {/* Top utility bar */}
      <div className="hidden md:flex bg-[#051A3E] text-[#9FB3CC] text-xs px-6 py-1.5 items-center justify-between max-w-[1400px] mx-auto">
        <span>Finora Bank — Member FDIC · Equal Housing Lender</span>
        <div className="flex items-center gap-4">
          <span>📞 1-800-FINORA (346-672)</span>
          <span>Mon–Fri 8am–8pm ET</span>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-white group"
          >
            <div className="w-8 h-8 bg-[#00C896] rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4.5 h-4.5 text-[#0A2D5E]" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-none tracking-tight">Finora</span>
              <span className="text-[#00C896] font-bold text-lg leading-none"> Bank</span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ view, label, Icon }) => {
              const active = activeView === view;
              return (
                <button
                  key={view}
                  onClick={() => onNavigate(view)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {active && <div className="w-1 h-1 bg-[#00C896] rounded-full ml-0.5" />}
                </button>
              );
            })}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all">
                  More <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mt-1">
                {MORE_LINKS.map(({ view, label, Icon }) => (
                  <DropdownMenuItem
                    key={view}
                    onClick={() => onNavigate(view)}
                    className={activeView === view ? 'bg-blue-50' : ''}
                  >
                    <Icon className="w-4 h-4 mr-2 text-[#0A2D5E]" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              onClick={() => onNavigate('notifications')}
              className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full text-blue-100 hover:bg-white/10 hover:text-white transition-all"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                  <div className="w-7 h-7 rounded-full bg-[#00C896] flex items-center justify-center text-[#0A2D5E] font-bold text-xs">
                    {initials || <User className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium max-w-[90px] truncate">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mt-1">
                <div className="px-3 py-2 border-b">
                  <p className="font-semibold text-sm text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => onNavigate('profile')}>
                  <User className="w-4 h-4 mr-2" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('notifications')}>
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-white hover:bg-white/10 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0D3570] border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-1">
            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white/10 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#00C896] flex items-center justify-center text-[#0A2D5E] font-bold">
                {initials}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-blue-200 text-xs truncate">{user?.email}</p>
              </div>
            </div>

            {[...NAV_LINKS, ...MORE_LINKS].map(({ view, label, Icon }) => (
              <button
                key={view}
                onClick={() => { onNavigate(view); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeView === view
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
              </button>
            ))}

            <div className="border-t border-white/10 pt-2 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all"
              >
                <LogOut className="w-4.5 h-4.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
