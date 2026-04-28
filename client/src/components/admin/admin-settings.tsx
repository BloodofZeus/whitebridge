import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Mail, Phone, Key, Save, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface AdminSettingRow {
  id: string;
  key: string;
  value: string;
  updatedAt: string | Date;
}

const FIELDS = [
  {
    group: 'Email (Resend)',
    icon: Mail,
    color: 'blue',
    fields: [
      { key: 'resend_api_key', label: 'Resend API Key', placeholder: 're_xxxxxxxxxxxxxxxxxxxxxxxx', sensitive: true },
    ],
  },
  {
    group: 'SMS (Twilio)',
    icon: Phone,
    color: 'purple',
    fields: [
      { key: 'twilio_account_sid', label: 'Twilio Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', sensitive: true },
      { key: 'twilio_auth_token', label: 'Twilio Auth Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', sensitive: true },
      { key: 'twilio_from_phone', label: 'Twilio From Phone', placeholder: '+15551234567', sensitive: false },
    ],
  },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  const { data: settings = [], isLoading } = useQuery<AdminSettingRow[]>({
    queryKey: ['/api/admin/settings'],
    retry: false,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      settings.forEach(s => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const settingsPayload = Object.entries(values)
        .filter(([, v]) => v.trim() && !v.includes('****'))
        .map(([key, value]) => ({ key, value }));
      return apiRequest('POST', '/api/admin/settings', { settings: settingsPayload });
    },
    onSuccess: () => {
      setDirty(false);
      toast({ title: 'Settings Saved', description: 'API credentials have been updated successfully.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const getStoredDate = (key: string) => {
    const row = settings.find(s => s.key === key);
    if (!row?.updatedAt) return null;
    return new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#0A2D5E] rounded-2xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0A2D5E]">Integration Settings</h2>
          <p className="text-sm text-slate-500">Configure Resend and Twilio credentials for multi-channel notifications</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Credential Security</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Stored values are masked in the interface. Restrict database access to protect these credentials. 
            Leave any field blank to keep the existing value unchanged.
          </p>
        </div>
      </div>

      {/* Settings Groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        FIELDS.map(group => {
          const GroupIcon = group.icon;
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 border-blue-200',
            purple: 'bg-purple-50 border-purple-200',
          };
          const iconColor: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-700',
            purple: 'bg-purple-100 text-purple-700',
          };

          return (
            <Card key={group.group} className={`border ${colorMap[group.color]}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor[group.color]}`}>
                    <GroupIcon className="w-4 h-4" />
                  </div>
                  <span className="text-slate-800">{group.group}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.fields.map(field => {
                  const storedDate = getStoredDate(field.key);
                  const isSet = settings.some(s => s.key === field.key);
                  const isVisible = showFields[field.key];
                  const currentVal = values[field.key] || '';

                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={field.key} className="text-sm font-semibold text-slate-700">
                          {field.label}
                        </Label>
                        <div className="flex items-center gap-2">
                          {isSet && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Configured
                            </Badge>
                          )}
                          {storedDate && (
                            <span className="text-[10px] text-slate-400">Updated {storedDate}</span>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id={field.key}
                          type={field.sensitive && !isVisible ? 'password' : 'text'}
                          value={currentVal}
                          onChange={e => handleChange(field.key, e.target.value)}
                          placeholder={isSet ? '(stored — enter new value to update)' : field.placeholder}
                          className="pl-10 pr-10 h-11 border-slate-200 bg-white font-mono text-sm"
                        />
                        {field.sensitive && (
                          <button
                            type="button"
                            onClick={() => setShowFields(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !dirty}
          className="bg-[#0A2D5E] hover:bg-[#051A3E] text-white px-8 h-11"
        >
          {saveMutation.isPending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Settings</>
          )}
        </Button>
        {!dirty && !saveMutation.isPending && (
          <span className="text-xs text-slate-400">All settings are up to date</span>
        )}
        {dirty && (
          <span className="text-xs text-amber-600 font-medium">You have unsaved changes</span>
        )}
      </div>

      {/* Usage Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700">How notifications are sent on transfer resolution</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-blue-700">1</span>
            </div>
            <p className="text-xs text-slate-600"><span className="font-semibold">In-app notification</span> — Always sent regardless of API configuration</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-blue-700">2</span>
            </div>
            <p className="text-xs text-slate-600"><span className="font-semibold">Email (Resend)</span> — Sent to recipient email address if Resend API key is configured</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-blue-700">3</span>
            </div>
            <p className="text-xs text-slate-600"><span className="font-semibold">SMS (Twilio)</span> — Sent to recipient phone number if Twilio credentials are configured above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
