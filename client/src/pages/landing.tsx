import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Zap, HeadphonesIcon, ChevronRight, ArrowRight,
  Lock, CheckCircle2, Star, ChevronLeft, Check
} from "lucide-react";

const HERO_SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&auto=format&fit=crop&q=80",
    category: "Personal Banking",
    headline: "Open accounts that reward you",
    sub: "Earn cashback, enjoy fee-free banking, and access your money 24/7 with NorthBridge.",
  },
  {
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&auto=format&fit=crop&q=80",
    category: "Business Banking",
    headline: "Business banking built for growth",
    sub: "Tailored accounts, invoice finance, and dedicated relationship managers for UK businesses.",
  },
  {
    img: "https://images.unsplash.com/photo-1537519646099-335112f03225?w=1600&auto=format&fit=crop&q=80",
    category: "Savings & Mortgages",
    headline: "Save smarter, live better",
    sub: "High-yield ISAs, competitive mortgage rates, and FSCS protection up to £85,000.",
  },
  {
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80",
    category: "Wealth Management",
    headline: "Your wealth, professionally managed",
    sub: "Expert advisors, bespoke investment portfolios, and estate planning for every stage of life.",
  },
];

const PLANS = [
  {
    name: "Standard",
    price: "£0",
    period: "/month",
    highlight: false,
    badge: null,
    features: [
      "UK current account",
      "Free Visa debit card",
      "Mobile app & online banking",
      "Instant UK bank transfers",
      "FSCS protected up to £85,000",
    ],
    cta: "Open free account",
  },
  {
    name: "Plus",
    price: "£9.99",
    period: "/month",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Standard",
      "1% cashback on card spend",
      "Arranged overdraft facility",
      "Priority 24/7 phone support",
      "Fee-free international transfers",
    ],
    cta: "Get Plus",
  },
  {
    name: "Premium",
    price: "£24.99",
    period: "/month",
    highlight: false,
    badge: null,
    features: [
      "Everything in Plus",
      "Worldwide travel insurance",
      "Dedicated personal concierge",
      "Exclusive savings rates",
      "Airport lounge access",
    ],
    cta: "Get Premium",
  },
];

const PEOPLE = [
  {
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    name: "Oliver Grant",
    role: "Chief Executive Officer",
  },
  {
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    name: "Sarah Whitmore",
    role: "Chief Operating Officer",
  },
  {
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    name: "James Kaur",
    role: "Chief Financial Officer",
  },
  {
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    name: "Linda Rahman",
    role: "Head of Wealth Management",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah T.",
    role: "Small Business Owner, Manchester",
    rating: 5,
    text: "NorthBridge helped me streamline my business finances. The transfer tools and relationship manager are exceptional.",
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&auto=format&fit=crop&q=80",
  },
  {
    name: "James K.",
    role: "Young Professional, London",
    rating: 5,
    text: "Switched from my old bank and couldn't be happier. The Plus account gives me cashback and no hidden fees.",
    img: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&auto=format&fit=crop&q=80",
  },
  {
    name: "Linda R.",
    role: "Retiree, Birmingham",
    rating: 5,
    text: "Their wealth planning team helped me set up my estate and ISA easily. Friendly, knowledgeable people.",
    img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&auto=format&fit=crop&q=80",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);

  const handleCTA = () => {
    if (user) setLocation(user.role === "admin" ? "/admin" : "/dashboard");
    else setLocation("/login");
  };

  const prevSlide = useCallback(() => setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);
  const nextSlide = useCallback(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), []);

  useEffect(() => {
    const t = setInterval(nextSlide, 4000);
    return () => clearInterval(t);
  }, [nextSlide]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero slideshow */}
      <section className="relative w-full overflow-hidden" style={{ height: "520px" }}>
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}
          >
            <img src={s.img} alt={s.headline} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-center z-10">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
            {/* Left overlay card — distinct semi-transparent dark navy container */}
            <div className="bg-[#0A2D5E]/80 backdrop-blur-sm rounded-xl p-7 max-w-lg">
              <span className="inline-block bg-[#C5003E] text-white text-xs font-semibold px-3 py-1 rounded mb-4 uppercase tracking-wide">
                {HERO_SLIDES[slide].category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {HERO_SLIDES[slide].headline}
              </h1>
              <p className="text-blue-100 text-base md:text-lg mb-6 leading-relaxed">
                {HERO_SLIDES[slide].sub}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-white/60 text-white hover:bg-white/15 font-semibold text-sm h-11 px-6 bg-transparent"
                  onClick={handleCTA}
                >
                  {user ? "Go to Dashboard" : "Start now"}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button
                  className="bg-[#C5003E] hover:bg-[#9E0031] text-white font-bold text-sm h-11 px-6"
                  onClick={() => setLocation("/products")}
                >
                  View details
                </Button>
              </div>
            </div>

            {/* Right: fixed account access card */}
            <div className="hidden lg:flex flex-col bg-white rounded-xl shadow-2xl p-6 min-w-[240px] w-64 flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-[#0A2D5E]" />
                <span className="text-[#0A2D5E] font-bold text-sm">Access your account</span>
              </div>
              <p className="text-slate-500 text-xs mb-5 leading-relaxed">
                Securely log in to manage your NorthBridge accounts online.
              </p>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold text-sm h-9 mb-3"
              >
                Go to login
              </Button>
              <button
                onClick={() => setLocation("/login")}
                className="text-xs text-[#0A2D5E] hover:text-[#C5003E] font-medium text-center transition-colors"
              >
                Enrol in online banking →
              </button>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                FCA Authorised · FSCS Protected
              </div>
            </div>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all ${i === slide ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/70"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#051A3E] py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Happy Customers", value: "1.2M+" },
              { label: "Assets Under Management", value: "£3.8B+" },
              { label: "UK Cities", value: "4" },
              { label: "Established", value: "2014" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[#C5003E] text-2xl md:text-3xl font-bold">{value}</p>
                <p className="text-blue-300 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Plans */}
      <section id="products" className="py-16 md:py-24 bg-[#F5F8FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-[#0A2D5E]/10 text-[#0A2D5E] border-0 text-xs font-semibold mb-4">Account Plans</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Choose Your Account Plan</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              All plans come with a UK current account, FSCS protection, and the NorthBridge mobile app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-white border-2 p-7 flex flex-col transition-shadow hover:shadow-xl ${
                  plan.highlight ? "border-[#0A2D5E] shadow-lg" : "border-slate-100"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C5003E] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-[#0A2D5E]">{plan.price}</span>
                    <span className="text-slate-400 text-sm mb-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-slate-600 text-sm">
                      <Check className="w-4 h-4 text-[#C5003E] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleCTA}
                  className={`w-full h-10 font-semibold text-sm ${
                    plan.highlight
                      ? "bg-[#0A2D5E] hover:bg-[#051A3E] text-white"
                      : "bg-white hover:bg-slate-50 text-[#0A2D5E] border border-[#0A2D5E]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-7 space-y-2">
            <p className="text-xs text-slate-400">
              All accounts include FSCS protection up to £85,000. Subject to eligibility and status. NorthBridge Capital Bank Ltd. is authorised by the FCA, No. 778901.
            </p>
            <button
              onClick={() => setLocation("/products")}
              className="text-sm font-semibold text-[#0A2D5E] hover:text-[#C5003E] transition-colors"
            >
              Compare all features →
            </button>
          </div>
        </div>
      </section>

      {/* Rates */}
      <section id="rates" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="bg-[#0A2D5E]/10 text-[#0A2D5E] border-0 text-xs font-semibold mb-4">Today's Rates</Badge>
            <h2 className="text-3xl font-bold text-slate-900">Competitive Rates You Deserve</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Savings AER", rate: "4.75%", sub: "Easy-access savings", color: "text-[#C5003E]" },
              { label: "Mortgage", rate: "4.89%", sub: "2-year fixed", color: "text-[#0A2D5E]" },
              { label: "Personal Loan", rate: "5.9%", sub: "Representative APR", color: "text-[#0A2D5E]" },
              { label: "ISA", rate: "4.60%", sub: "Cash ISA AER", color: "text-[#0A2D5E]" },
            ].map(({ label, rate, sub, color }) => (
              <div key={label} className="bg-[#F5F8FF] rounded-2xl p-5 text-center border border-slate-100">
                <p className={`text-3xl font-bold ${color}`}>{rate}</p>
                <p className="text-slate-900 font-semibold text-sm mt-1">{label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our People */}
      <section className="py-16 bg-[#F5F8FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="bg-[#0A2D5E]/10 text-[#0A2D5E] border-0 text-xs font-semibold mb-4">Our Leadership</Badge>
            <h2 className="text-3xl font-bold text-slate-900">The People Behind NorthBridge</h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto">
              Experienced banking professionals committed to delivering exceptional service across the UK — from Manchester, Salford, London, and Birmingham.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {PEOPLE.map(({ img, name, role }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow text-center group">
                <div className="h-48 overflow-hidden">
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-900 text-sm">{name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NorthBridge */}
      <section id="about" className="relative py-16 md:py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80"
          alt="NorthBridge office"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0A2D5E]/85" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-white/15 text-white border-0 text-xs font-semibold mb-4">Why NorthBridge</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Banking You Can Trust</h2>
            <p className="text-blue-200 mt-4 max-w-xl mx-auto">
              We put our customers first in everything we do. From security to service, FCA-regulated excellence is our standard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: Shield,
                title: "Bank-Grade Security",
                desc: "Your deposits are FSCS protected up to £85,000. We use multi-factor authentication, 256-bit encryption, and real-time fraud monitoring.",
              },
              {
                Icon: Zap,
                title: "Lightning Fast",
                desc: "Open an account in 5 minutes. Send money instantly via Faster Payments. Access your funds 24/7 via our award-winning mobile app.",
              },
              {
                Icon: HeadphonesIcon,
                title: "24/7 Expert Support",
                desc: "Our Manchester-based banking specialists are available around the clock via phone, chat, or email. Real people, real help.",
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-[#C5003E]/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#C5003E]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-[#F5F8FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, rating, text, img }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-3">
                  <img src={img} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Ready to Bank Better?</h2>
          <p className="text-slate-500 mb-8 text-lg">
            Join 1.2 million customers who trust NorthBridge Capital Bank with their financial future.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={handleCTA}
              className="bg-[#C5003E] hover:bg-[#9E0031] text-white font-bold text-base h-12 px-8"
            >
              {user ? "Go to Dashboard" : "Open Free Account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/products")}
              className="border-[#0A2D5E] text-[#0A2D5E] font-semibold text-base h-12 px-8 hover:bg-[#F0F4FF]"
            >
              Compare Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#051A3E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-base block leading-none">NorthBridge</span>
                  <span className="text-[10px] text-[#C5003E] font-semibold tracking-wide uppercase block">Capital Bank Ltd.</span>
                </div>
              </div>
              <p className="text-blue-300 text-xs leading-relaxed mb-3">
                Building financial futures since 2014. FCA Authorised · FSCS Protected.
                Branches in Manchester, Salford, London, and Birmingham.
              </p>
              <p className="text-blue-400 text-xs">85 King Street, Manchester M2 4WQ</p>
              <p className="text-blue-400 text-xs mt-1">📞 +44 161 850 4721</p>
              <p className="text-blue-400 text-xs mt-1">✉ support@northbridgecapital.co.uk</p>
            </div>

            {[
              {
                title: "Products",
                links: [
                  { label: "Current Accounts", href: "/products?category=checking" },
                  { label: "Savings & ISAs", href: "/products?category=savings" },
                  { label: "Credit Cards", href: "/products?category=credit-cards" },
                  { label: "Mortgages", href: "/products?category=mortgages" },
                  { label: "Investing", href: "/investing" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Us", href: "/services" },
                  { label: "Careers", href: "/services" },
                  { label: "Press", href: "/services" },
                  { label: "Blog", href: "/services" },
                  { label: "Promotions", href: "/promotions" },
                ],
              },
              {
                title: "Support",
                links: [
                  { label: "Help Centre", href: "/help" },
                  { label: "Find a Branch", href: "/find-branch" },
                  { label: "Security Centre", href: "/help" },
                  { label: "Privacy Policy", href: "/help" },
                  { label: "Terms of Service", href: "/help" },
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-semibold text-white mb-3 text-sm">{title}</p>
                <ul className="space-y-2">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <a href={href} className="text-blue-300 text-xs hover:text-white transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-blue-300 text-[11px]">
            <p>
              © 2026 NorthBridge Capital Bank Ltd. Registered in England and Wales No. 09284756.
              FCA No. 778901 · FSCS Protected
            </p>
            <p className="text-blue-400">
              SWIFT: NBCBGB2M · Sort Code: 40-62-18
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
