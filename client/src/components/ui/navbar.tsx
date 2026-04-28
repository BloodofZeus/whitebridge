import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, ChevronRight, Shield } from "lucide-react";

const MEGA_MENU = [
  {
    label: "Personal",
    items: [
      { label: "Current Accounts", href: "/products?category=checking" },
      { label: "Savings Accounts", href: "/products?category=savings" },
      { label: "Credit Cards", href: "/products?category=credit-cards" },
      { label: "Personal Loans", href: "/products?category=loans" },
      { label: "Mortgages", href: "/products?category=mortgages" },
      { label: "Insurance", href: "/services" },
    ],
  },
  {
    label: "Wealth Management",
    items: [
      { label: "Investment Portfolios", href: "/investing" },
      { label: "ISA & Pensions", href: "/investing" },
      { label: "Estate Planning", href: "/private-client" },
      { label: "Wealth Advisory", href: "/private-client" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Business Current Accounts", href: "/business" },
      { label: "Business Loans", href: "/business" },
      { label: "Merchant Services", href: "/business" },
      { label: "Business Credit Cards", href: "/business" },
      { label: "Invoice Finance", href: "/commercial" },
    ],
  },
  {
    label: "Corporate & Commercial",
    items: [
      { label: "Commercial Lending", href: "/commercial" },
      { label: "Treasury Services", href: "/commercial" },
      { label: "Trade Finance", href: "/commercial" },
      { label: "Corporate Cards", href: "/commercial" },
    ],
  },
  {
    label: "Institutional",
    items: [
      { label: "Capital Markets", href: "/private-client" },
      { label: "Asset Management", href: "/investing" },
      { label: "Custody Services", href: "/private-client" },
      { label: "Structured Finance", href: "/commercial" },
    ],
  },
];

const SUB_NAV = [
  { label: "Checking & savings", href: "/products?category=checking" },
  { label: "Credit cards", href: "/products?category=credit-cards" },
  { label: "Investing & retirement", href: "/investing" },
  { label: "Personal loans", href: "/products?category=loans" },
  { label: "Home loans", href: "/products?category=mortgages" },
  { label: "Vehicle loans", href: "/products?category=auto" },
];

interface NavbarProps {
  showLogin?: boolean;
}

export default function Navbar({ showLogin }: NavbarProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 shadow-md" ref={dropdownRef}>

      {/* Utility bar */}
      <div className="hidden md:flex bg-[#F0F2F5] text-[#444] text-xs px-6 py-1.5 items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
          <a href="/services" className="hover:text-[#0A2D5E] transition-colors">About us</a>
          <span className="text-gray-300">|</span>
          <a href="/services" className="hover:text-[#0A2D5E] transition-colors">Financial education</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/help" className="hover:text-[#0A2D5E] transition-colors">Support</a>
          <span className="text-gray-300">|</span>
          <a href="/find-branch" className="hover:text-[#0A2D5E] transition-colors">Locations</a>
          <span className="text-gray-300">|</span>
          <a href="/help" className="flex items-center gap-1 hover:text-[#0A2D5E] transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#C5003E] inline-block" />
            How can we help you?
          </a>
          <button
            onClick={() => setLocation("/login")}
            className="bg-[#C5003E] hover:bg-[#9E0031] text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
          >
            Log In
          </button>
        </div>
      </div>

      {/* Primary nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-[#0A2D5E] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-[#0A2D5E] text-base block leading-none">NorthBridge</span>
                <span className="text-[10px] text-[#C5003E] font-semibold tracking-wide uppercase block leading-none">Capital Bank Ltd.</span>
              </div>
            </Link>

            {/* Desktop mega-menu */}
            <nav className="hidden md:flex items-center gap-0.5 h-full">
              {MEGA_MENU.map((cat) => (
                <div key={cat.label} className="relative h-full flex items-center">
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors h-full rounded-none border-b-2 ${
                      activeDropdown === cat.label
                        ? "text-[#0A2D5E] border-[#C5003E]"
                        : "text-slate-700 border-transparent hover:text-[#0A2D5E] hover:border-[#C5003E]"
                    }`}
                    onMouseEnter={() => setActiveDropdown(cat.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    onClick={() => setActiveDropdown(activeDropdown === cat.label ? null : cat.label)}
                  >
                    {cat.label}
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === cat.label ? "rotate-180" : ""}`} />
                  </button>

                  {activeDropdown === cat.label && (
                    <div
                      className="absolute top-full left-0 bg-white shadow-xl border border-gray-100 rounded-b-lg min-w-[220px] py-2 z-50"
                      onMouseEnter={() => setActiveDropdown(cat.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {cat.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-[#F0F4FF] hover:text-[#0A2D5E] transition-colors group"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {item.label}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#C5003E] transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <Button
                  onClick={() => setLocation(user.role === "admin" ? "/admin" : "/dashboard")}
                  className="bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold text-sm h-9 px-4"
                >
                  Go to Dashboard <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => setLocation("/login")}
                  className="bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold text-sm h-9 px-4"
                >
                  Enroll Now
                </Button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-[#0A2D5E] hover:bg-slate-100 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-nav bar (desktop only) */}
      <div className="hidden md:block bg-[#0A2D5E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0 h-9 overflow-x-auto">
            {SUB_NAV.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-blue-200 hover:text-white text-xs font-medium px-3 py-1.5 whitespace-nowrap hover:bg-white/10 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            {user ? (
              <Button
                onClick={() => { setLocation(user.role === "admin" ? "/admin" : "/dashboard"); setMobileOpen(false); }}
                className="w-full bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold text-sm h-10"
              >
                Go to Dashboard
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => { setLocation("/login"); setMobileOpen(false); }}
                  className="flex-1 bg-[#C5003E] hover:bg-[#9E0031] text-white font-semibold text-sm h-10"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => { setLocation("/login"); setMobileOpen(false); }}
                  className="flex-1 bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold text-sm h-10"
                >
                  Enroll
                </Button>
              </div>
            )}
          </div>

          {MEGA_MENU.map((cat) => (
            <div key={cat.label} className="border-b border-gray-100">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0A2D5E]"
                onClick={() => setMobileExpanded(mobileExpanded === cat.label ? null : cat.label)}
              >
                {cat.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === cat.label ? "rotate-180" : ""}`} />
              </button>
              {mobileExpanded === cat.label && (
                <div className="bg-slate-50 pb-2">
                  {cat.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-8 py-2 text-sm text-slate-600 hover:text-[#0A2D5E]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="px-4 py-3 space-y-2">
            {[
              { label: "About us", href: "/services" },
              { label: "Financial education", href: "/services" },
              { label: "Support", href: "/help" },
              { label: "Locations", href: "/find-branch" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="block text-sm text-slate-500 hover:text-[#0A2D5E] py-1" onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
