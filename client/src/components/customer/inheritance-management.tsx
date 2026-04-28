import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Beneficiary } from '@shared/schema';
import {
  Shield, UserPlus, Trash2, Edit3, AlertTriangle,
  User, Phone, Mail, Percent, Check, X
} from 'lucide-react';

interface Props { onNavigate: (view: string) => void; }

const beneficiarySchema = z.object({
  name: z.string().min(1, 'Full name required'),
  relationship: z.string().min(1, 'Select relationship'),
  percentage: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 100, 'Must be 1–100'),
  contactInfo: z.string().min(1, 'Contact info required'),
});
type BeneficiaryForm = z.infer<typeof beneficiarySchema>;

export default function InheritanceManagement({ onNavigate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: beneficiaries = [], isLoading } = useQuery<Beneficiary[]>({ queryKey: ['/api/beneficiaries'], retry: false });

  const form = useForm<BeneficiaryForm>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: { name: '', relationship: '', percentage: '', contactInfo: '' },
  });

  const totalAllocation = beneficiaries.reduce((s, b) => s + Number(b.percentage ?? 0), 0);

  const addBeneficiary = useMutation({
    mutationFn: (data: BeneficiaryForm) => apiRequest('POST', '/api/beneficiaries', { ...data, percentage: Number(data.percentage) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beneficiaries'] });
      form.reset();
      setShowForm(false);
      toast({ title: 'Beneficiary added successfully' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
  });

  const deleteBeneficiary = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/beneficiaries/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beneficiaries'] });
      toast({ title: 'Beneficiary removed' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to remove beneficiary' }),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  const COLORS = ['#0A2D5E', '#00C896', '#1E4A87', '#059669', '#7C3AED', '#DC2626'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Estate Planning</h1>
        <p className="text-sm text-slate-500">Manage your beneficiaries and inheritance settings</p>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 bg-[#F0F4FF] rounded-xl border border-[#0A2D5E]/10">
        <Shield className="w-4.5 h-4.5 text-[#0A2D5E] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#0A2D5E]">Why designate beneficiaries?</p>
          <p className="text-xs text-slate-600 mt-0.5">Beneficiaries ensure your assets are distributed according to your wishes without going through probate. Keep this information current and accurate.</p>
        </div>
      </div>

      {/* Allocation summary */}
      {beneficiaries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-900 text-sm">Allocation Summary</p>
            <Badge className={`text-[10px] border-0 ${totalAllocation === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {totalAllocation}% allocated
            </Badge>
          </div>
          <div className="flex rounded-full overflow-hidden h-3 mb-3">
            {beneficiaries.map((b, i) => (
              <div
                key={b.id}
                style={{ width: `${b.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                title={`${b.name}: ${b.percentage}%`}
              />
            ))}
            {totalAllocation < 100 && (
              <div style={{ width: `${100 - totalAllocation}%` }} className="bg-slate-100" />
            )}
          </div>
          {totalAllocation !== 100 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {100 - totalAllocation}% unallocated — update to reach 100%
            </p>
          )}
        </div>
      )}

      {/* Beneficiaries list */}
      {beneficiaries.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">Beneficiaries ({beneficiaries.length})</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs text-[#0A2D5E] font-medium hover:text-[#00C896] transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {beneficiaries.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                  {b.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{b.relationship} · {b.contactInfo || 'No contact'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0A2D5E]">{b.percentage}%</p>
                  </div>
                  <button
                    onClick={() => deleteBeneficiary.mutate(b.id)}
                    disabled={deleteBeneficiary.isPending}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium text-slate-500">No beneficiaries designated</p>
          <p className="text-slate-400 text-sm mt-1">Add beneficiaries to protect your loved ones</p>
        </div>
      )}

      {/* Add beneficiary form */}
      {showForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="bank-card-gradient px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-white font-semibold">Add Beneficiary</p>
            </div>
            <button onClick={() => { setShowForm(false); form.reset(); }} className="text-white/70 hover:text-white transition-colors">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addBeneficiary.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Full Name</FormLabel>
                    <FormControl><Input className="h-10 border-slate-200 text-sm" placeholder="e.g. Jane Smith" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="relationship" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Relationship</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 border-slate-200">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['spouse', 'child', 'parent', 'sibling', 'grandchild', 'other'].map(r => (
                          <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contactInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Contact Info</FormLabel>
                    <FormControl><Input className="h-10 border-slate-200 text-sm" placeholder="Email or phone number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="percentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Allocation %</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" min="1" max="100" className="h-10 border-slate-200 text-sm pr-8" placeholder="e.g. 50" {...field} />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-10" disabled={addBeneficiary.isPending}>
                  {addBeneficiary.isPending ? 'Saving…' : <><Check className="w-3.5 h-3.5 mr-1.5" /> Add Beneficiary</>}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-[#0A2D5E]/30 bg-transparent text-[#0A2D5E] hover:bg-[#F0F4FF] text-sm h-11 font-medium"
          variant="outline"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add a Beneficiary
        </Button>
      )}
    </div>
  );
}
