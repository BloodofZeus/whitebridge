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
import {
  Receipt, Zap, Droplets, Wifi, Phone, Home, Car,
  CheckCircle2, Clock, XCircle
} from "lucide-react";
import { type ElementType } from "react";
import type { Account, BillPayment } from "@shared/schema";

interface Props { onNavigate: (view: string) => void; }
const fmt = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

const billSchema = z.object({
  accountId: z.string().min(1, "Select account"),
  billType: z.string().min(1, "Select bill type"),
  billerName: z.string().min(1, "Enter biller name"),
  billerAccountNumber: z.string().min(1, "Enter biller account number"),
  amount: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, "Enter valid amount"),
  dueDate: z.string().optional(),
});
type BillForm = z.infer<typeof billSchema>;

const PAYEE_ICONS: Record<string, ElementType> = {
  utilities: Zap,
  water: Droplets,
  internet: Wifi,
  phone: Phone,
  rent: Home,
  insurance: Car,
};

const SAMPLE_PAYEES = [
  { name: 'City Electric Co.', billType: 'utilities', billerAccountNumber: 'CEL-8821', amount: 145.50, dueDate: '2026-04-15' },
  { name: 'Metro Water Utility', billType: 'water', billerAccountNumber: 'MWU-3302', amount: 62.00, dueDate: '2026-04-20' },
  { name: 'FastNet ISP', billType: 'internet', billerAccountNumber: 'FN-4492', amount: 79.99, dueDate: '2026-04-22' },
  { name: 'MobileFirst', billType: 'phone', billerAccountNumber: 'MF-9901', amount: 95.00, dueDate: '2026-04-25' },
];

export default function BillPayments({ onNavigate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'pay' | 'scheduled'>('pay');
  const [selected, setSelected] = useState<typeof SAMPLE_PAYEES[0] | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({ queryKey: ["/api/accounts"], retry: false });
  const { data: payments = [] } = useQuery<BillPayment[]>({ queryKey: ["/api/bill-payments"], retry: false });

  const form = useForm<BillForm>({
    resolver: zodResolver(billSchema),
    defaultValues: { accountId: '', billType: '', billerName: '', billerAccountNumber: '', amount: '', dueDate: '' },
  });

  const payBill = useMutation({
    mutationFn: (data: BillForm) => apiRequest("POST", "/api/bill-payments", {
      accountId: data.accountId,
      billType: data.billType,
      billerName: data.billerName,
      billerAccountNumber: data.billerAccountNumber,
      amount: Number(data.amount),
      dueDate: data.dueDate || null,
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      form.reset();
      setSelected(null);
      toast({ title: "Payment scheduled!", description: "Your bill payment has been submitted." });
      setTab('scheduled');
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Payment failed", description: e.message }),
  });

  const handleQuickPay = (p: typeof SAMPLE_PAYEES[0]) => {
    const isAlreadySelected = selected?.name === p.name;
    if (isAlreadySelected) {
      setSelected(null);
      form.reset();
    } else {
      setSelected(p);
      form.setValue('billerName', p.name);
      form.setValue('billType', p.billType);
      form.setValue('billerAccountNumber', p.billerAccountNumber);
      form.setValue('amount', String(p.amount));
      if (p.dueDate) form.setValue('dueDate', p.dueDate);
    }
  };

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bill Payments</h1>
        <p className="text-sm text-slate-500">Pay and schedule your bills</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['pay', 'scheduled'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-[#0A2D5E] shadow-sm' : 'text-slate-600'}`}
          >
            {t === 'pay' ? 'Pay a Bill' : 'Scheduled'}
          </button>
        ))}
      </div>

      {tab === 'pay' && (
        <div className="space-y-4">
          {/* Quick payees */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-5 pt-5 pb-3">
              <p className="font-semibold text-slate-900 text-sm">Upcoming Bills — Quick Pay</p>
              <p className="text-xs text-slate-400 mt-0.5">Tap a bill to pre-fill the form below</p>
            </div>
            <div className="divide-y divide-slate-50">
              {SAMPLE_PAYEES.map(p => {
                const Icon = PAYEE_ICONS[p.billType] ?? Receipt;
                const isSelected = selected?.name === p.name;
                const daysUntil = Math.ceil((new Date(p.dueDate).getTime() - Date.now()) / 86400000);
                return (
                  <button
                    key={p.name}
                    onClick={() => handleQuickPay(p)}
                    className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left ${isSelected ? 'bg-[#F0F4FF]' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                      <Icon className="w-4.5 h-4.5 text-[#0A2D5E]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">Due {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{fmt(p.amount)}</p>
                      <Badge className={`text-[10px] border-0 ${daysUntil <= 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {daysUntil}d left
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment form */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="bank-card-gradient px-6 py-4">
              <p className="text-white font-semibold">Payment Details</p>
              {selected && <p className="text-blue-200 text-xs mt-0.5">Paying: {selected.name}</p>}
            </div>
            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => payBill.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="accountId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Pay From</FormLabel>
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

                  <FormField control={form.control} name="billType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Bill Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-slate-200">
                            <SelectValue placeholder="Select bill type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="utilities">Utilities / Electricity</SelectItem>
                          <SelectItem value="water">Water</SelectItem>
                          <SelectItem value="internet">Internet / Cable</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="rent">Rent / Mortgage</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="tv">TV / Streaming</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="billerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Biller Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. City Electric Co." className="h-11 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="billerAccountNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Biller Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your account number with the biller" className="h-11 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <Input placeholder="0.00" type="number" step="0.01" min="0" className="h-11 border-slate-200 pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">Payment Date <span className="text-slate-400 font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input type="date" className="h-11 border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-semibold"
                    disabled={payBill.isPending}
                  >
                    {payBill.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </div>
                    ) : <><Receipt className="w-4 h-4 mr-2" /> Submit Payment</>}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {tab === 'scheduled' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Scheduled & Recent Payments</h2>
          </div>
          {payments.length === 0 ? (
            <div className="py-14 text-center">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-medium">No scheduled payments</p>
              <p className="text-slate-400 text-sm mt-1">Your bill payment history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.status === 'paid' ? 'bg-emerald-50' : p.status === 'failed' ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                    {p.status === 'paid'
                      ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                      : p.status === 'failed'
                      ? <XCircle className="w-4.5 h-4.5 text-red-500" />
                      : <Clock className="w-4.5 h-4.5 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{p.billerName || 'Bill Payment'}</p>
                    <p className="text-xs text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {p.billType || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">−{fmt(p.amount)}</p>
                    <Badge className={`text-[10px] border-0 ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status || 'pending'}
                    </Badge>
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
