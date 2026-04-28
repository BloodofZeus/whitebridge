import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Investment, Account } from "@shared/schema";
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, ArrowUpRight,
  DollarSign, Target, Briefcase, Plus, Eye, EyeOff
} from "lucide-react";

interface Props { onNavigate: (view: string) => void; }
const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

const investSchema = z.object({
  type: z.string().min(1, "Select type"),
  instrumentName: z.string().min(1, "Enter symbol or fund name"),
  amount: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, "Enter valid amount"),
  accountId: z.string().min(1, "Select funding account"),
});
type InvestForm = z.infer<typeof investSchema>;

const PORTFOLIO_ALLOC = [
  { name: 'US Stocks', pct: 45, color: '#0A2D5E', return: '+18.2%', positive: true },
  { name: 'Int\'l Stocks', pct: 25, color: '#00C896', return: '+12.4%', positive: true },
  { name: 'Bonds', pct: 20, color: '#1E4A87', return: '+3.1%', positive: true },
  { name: 'Cash', pct: 10, color: '#CBD5E1', return: '+0.5%', positive: true },
];

export default function InvestmentDashboard({ onNavigate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'invest' | 'holdings'>('overview');
  const [showValue, setShowValue] = useState(true);

  const { data: investments = [], isLoading } = useQuery<Investment[]>({ queryKey: ["/api/investments"], retry: false });
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ["/api/accounts"], retry: false });

  const totalValue = investments.reduce((s, inv) => s + Number(inv.currentValue ?? inv.amount ?? 0), 0);
  const totalCost = investments.reduce((s, inv) => s + Number(inv.purchasePrice ?? inv.amount ?? 0), 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : '0.00';

  const form = useForm<InvestForm>({
    resolver: zodResolver(investSchema),
    defaultValues: { type: '', instrumentName: '', amount: '', accountId: '' },
  });

  const invest = useMutation({
    mutationFn: (data: InvestForm) => apiRequest("POST", "/api/investments", { ...data, amount: Number(data.amount) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      form.reset();
      toast({ title: "Investment submitted!", description: "Your investment order has been placed." });
      setTab('holdings');
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Investment Portfolio</h1>
        <p className="text-sm text-slate-500">Manage and grow your wealth</p>
      </div>

      {/* Portfolio summary card */}
      <div className="bank-card-gradient rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wider">Total Portfolio Value</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold">{showValue ? fmt(totalValue || 84250) : '•••••••'}</p>
                <button onClick={() => setShowValue(v => !v)} className="text-blue-200 hover:text-white">
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${Number(gainPct) >= 0 ? 'bg-emerald-500/30 text-emerald-200' : 'bg-red-500/30 text-red-200'}`}>
              {Number(gainPct) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {gainPct}%
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Return', value: fmt(Math.abs(totalGain) || 7340), positive: totalGain >= 0 },
              { label: 'Invested', value: fmt(totalCost || 76910), positive: true },
              { label: 'Holdings', value: String(investments.length || 4), positive: true },
            ].map(({ label, value, positive }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <p className="text-blue-200 text-[10px] uppercase tracking-wide">{label}</p>
                <p className="text-white font-bold text-sm mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['overview', 'invest', 'holdings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-white text-[#0A2D5E] shadow-sm' : 'text-slate-600'}`}
          >
            {t === 'overview' ? 'Allocation' : t === 'invest' ? 'Invest' : 'Holdings'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="font-semibold text-slate-900 mb-4">Portfolio Allocation</p>
            {/* Bar */}
            <div className="flex rounded-full overflow-hidden h-3 mb-4">
              {PORTFOLIO_ALLOC.map(a => (
                <div key={a.name} style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
              ))}
            </div>
            <div className="space-y-3">
              {PORTFOLIO_ALLOC.map(a => (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">{a.name}</span>
                      <span className="text-sm font-semibold text-slate-900">{a.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                    </div>
                  </div>
                  <Badge className={`text-[10px] border-0 ${a.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {a.return}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Performance metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '1D Return', value: '+$124.50', sub: '+0.15%', pos: true, Icon: TrendingUp },
              { label: '1M Return', value: '+$1,243', sub: '+1.5%', pos: true, Icon: BarChart3 },
              { label: 'YTD Return', value: '+$7,340', sub: '+9.5%', pos: true, Icon: Target },
              { label: 'Risk Score', value: '6.2/10', sub: 'Moderate', pos: true, Icon: PieChart },
            ].map(({ label, value, sub, pos, Icon }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">{label}</p>
                  <Icon className="w-4 h-4 text-slate-300" />
                </div>
                <p className={`font-bold ${pos ? 'text-emerald-600' : 'text-red-500'}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'invest' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="bank-card-gradient px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">New Investment</p>
                <p className="text-blue-200 text-xs">Diversify your portfolio</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => invest.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Investment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stocks">Individual Stocks</SelectItem>
                        <SelectItem value="etf">ETFs / Index Funds</SelectItem>
                        <SelectItem value="bonds">Bonds</SelectItem>
                        <SelectItem value="mutual_funds">Mutual Funds</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="instrumentName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Symbol / Fund Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AAPL, VTSAX, SPY" className="h-11 border-slate-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Investment Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input placeholder="0.00" type="number" step="0.01" min="0" className="h-11 border-slate-200 pl-7" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="accountId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Fund From Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select account" />
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

                <Button type="submit" className="w-full h-11 bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold" disabled={invest.isPending}>
                  {invest.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </div>
                  ) : <><Briefcase className="w-4 h-4 mr-2" /> Place Investment Order</>}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {tab === 'holdings' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Current Holdings</h2>
          </div>
          {investments.length === 0 ? (
            <div className="py-14 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-medium">No investments yet</p>
              <Button onClick={() => setTab('invest')} className="mt-4 bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-9 px-4">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Start Investing
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {investments.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 bg-[#F0F4FF] rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-[#0A2D5E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{inv.instrumentName}</p>
                    <p className="text-xs text-slate-400 capitalize">{inv.type ?? 'Stock'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{fmt(inv.currentValue ?? inv.amount)}</p>
                    <Badge className="text-[10px] border-0 bg-emerald-100 text-emerald-700">+{((parseInt(inv.id.replace(/-/g,'').slice(0,4),16) % 130 + 20) / 10).toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
