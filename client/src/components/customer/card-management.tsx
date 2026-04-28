import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Eye, EyeOff, Lock, Unlock, SnowflakeIcon,
  Settings, Shield, Globe, ShoppingBag, Zap, AlertTriangle
} from "lucide-react";
import type { Card as BankCard } from "@shared/schema";

interface Props { onNavigate: (view: string) => void; }

export default function CardManagement({ onNavigate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNumbers, setShowNumbers] = useState<Record<string, boolean>>({});

  const { data: cards = [], isLoading } = useQuery<BankCard[]>({ queryKey: ["/api/cards"], retry: false });

  const updateCard = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/cards/${id}/status`, { status }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cards"] }); },
    onError: () => toast({ variant: "destructive", title: "Failed to update card" }),
  });

  const toggleFreeze = (card: BankCard) => {
    const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
    updateCard.mutate({ id: card.id, status: newStatus });
    toast({ title: newStatus === 'frozen' ? "Card frozen successfully" : "Card unfrozen successfully" });
  };

  const toggleShow = (id: string) => setShowNumbers(p => ({ ...p, [id]: !p[id] }));
  const maskNum = (n: string) => `•••• •••• •••• ${n?.slice(-4) || '****'}`;

  const cardGradients = [
    'bg-gradient-to-br from-[#0A2D5E] to-[#1E4A87]',
    'bg-gradient-to-br from-slate-700 to-slate-900',
    'bg-gradient-to-br from-emerald-700 to-emerald-500',
    'bg-gradient-to-br from-violet-700 to-violet-500',
  ];

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Cards</h1>
        <p className="text-sm text-slate-500">{cards.length} card{cards.length !== 1 ? 's' : ''} linked</p>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No cards found</p>
        </div>
      ) : (
        cards.map((card: BankCard, idx: number) => {
          const isFrozen = card.status === 'frozen';
          const isShown = showNumbers[card.id];
          const gradient = cardGradients[idx % cardGradients.length];

          return (
            <div key={card.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {/* Visual card */}
              <div className={`${gradient} text-white p-6 relative overflow-hidden`}>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

                {isFrozen && (
                  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <SnowflakeIcon className="w-8 h-8 text-blue-200 mx-auto mb-1" />
                      <p className="text-white font-bold text-sm">Card Frozen</p>
                    </div>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white/60 text-[10px] uppercase tracking-widest">Finora Bank</p>
                      <p className="text-white font-bold text-sm">{card.type?.toUpperCase() ?? 'VISA'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] border-0 ${isFrozen ? 'bg-blue-400/30 text-blue-100' : 'bg-white/20 text-white'}`}>
                        {isFrozen ? '❄ Frozen' : '✓ Active'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-white font-mono text-lg tracking-widest">
                      {isShown ? (card.cardNumber || '4532 •••• •••• ••••') : maskNum(card.cardNumber || '')}
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase">Card Holder</p>
                      <p className="text-white text-sm font-medium">{card.cardHolderName || 'Account Holder'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-[10px] uppercase">Expires</p>
                      <p className="text-white text-sm font-mono">{card.expiryDate || '••/••'}</p>
                    </div>
                    <button
                      onClick={() => toggleShow(card.id)}
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                      {isShown ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card controls */}
              <div className="p-5 space-y-4">
                {/* Freeze toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isFrozen ? 'bg-blue-100' : 'bg-slate-200'}`}>
                      {isFrozen ? <Lock className="w-4.5 h-4.5 text-blue-600" /> : <Unlock className="w-4.5 h-4.5 text-slate-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{isFrozen ? 'Card is frozen' : 'Freeze card'}</p>
                      <p className="text-xs text-slate-500">Temporarily block all transactions</p>
                    </div>
                  </div>
                  <Switch
                    checked={isFrozen}
                    onCheckedChange={() => toggleFreeze(card)}
                    disabled={updateCard.isPending}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                {/* Spending controls */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Online', Icon: Globe, color: 'text-[#0A2D5E] bg-[#F0F4FF]' },
                    { label: 'In-Store', Icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'ATM',     Icon: Zap,         color: 'text-amber-600 bg-amber-50' },
                  ].map(({ label, Icon, color }) => (
                    <button key={label} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Actions row */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleFreeze(card)}
                    variant="outline"
                    className={`flex-1 text-sm h-9 ${isFrozen ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'border-blue-400 text-blue-600 hover:bg-blue-50'}`}
                    disabled={updateCard.isPending}
                  >
                    {isFrozen ? <Unlock className="w-3.5 h-3.5 mr-1.5" /> : <Lock className="w-3.5 h-3.5 mr-1.5" />}
                    {isFrozen ? 'Unfreeze' : 'Freeze Card'}
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm h-9 border-slate-200 text-slate-600">
                    <Settings className="w-3.5 h-3.5 mr-1.5" /> Limits
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm h-9 border-red-200 text-red-500 hover:bg-red-50">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Report
                  </Button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Security tip */}
      <div className="flex items-start gap-3 p-4 bg-[#F0F4FF] rounded-xl border border-[#0A2D5E]/10">
        <Shield className="w-4.5 h-4.5 text-[#0A2D5E] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-[#0A2D5E]">Card Security:</span> We monitor transactions 24/7. Freeze your card immediately if you suspect unauthorized use. Contact support for lost or stolen cards.
        </p>
      </div>
    </div>
  );
}
