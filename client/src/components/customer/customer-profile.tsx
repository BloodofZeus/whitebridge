import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { CustomerProfile } from "@shared/schema";
import {
  User, Mail, Phone, MapPin, Shield, Edit3, Check, X,
  Key, Eye, EyeOff, Lock, LogOut
} from "lucide-react";

interface Props { onNavigate: (view: string) => void; }

const profileSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string().min(1, "Required"),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type PwdForm = z.infer<typeof passwordSchema>;

export default function CustomerProfile({ onNavigate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<CustomerProfile>({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: '',
      address: '',
    },
  });

  useEffect(() => {
    form.reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      address: profile?.address ?? '',
    });
  }, [user, profile]);

  const pwdForm = useForm<PwdForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => apiRequest("PUT", "/api/profile", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Update failed", description: e.message }),
  });

  const changePassword = useMutation({
    mutationFn: (data: PwdForm) => apiRequest("POST", "/api/change-password", data).then(r => r.json()),
    onSuccess: () => {
      pwdForm.reset();
      toast({ title: "Password changed successfully" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  if (profileLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Manage your account information and security</p>
      </div>

      {/* Avatar / summary */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="bank-card-gradient px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user?.firstName} {user?.lastName}</p>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              <Badge className="mt-1.5 bg-[#00C896]/20 text-[#00C896] border-0 text-[10px]">
                ✓ Verified Customer
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-slate-900 text-sm">Personal Information</p>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-[#0A2D5E] font-medium hover:text-[#00C896] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <button
                onClick={() => { setEditing(false); form.reset(); }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          {editing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600">First Name</FormLabel>
                      <FormControl><Input className="h-10 border-slate-200 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600">Last Name</FormLabel>
                      <FormControl><Input className="h-10 border-slate-200 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Phone</FormLabel>
                    <FormControl><Input className="h-10 border-slate-200 text-sm" placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Address</FormLabel>
                    <FormControl><Input className="h-10 border-slate-200 text-sm" placeholder="123 Main St, City, State" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-9" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? 'Saving…' : <><Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes</>}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-3">
              {[
                { Icon: User,   label: 'Full Name', value: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Not set' },
                { Icon: Mail,   label: 'Email',     value: user?.email ?? 'Not set' },
                { Icon: Phone,  label: 'Phone',     value: profile?.phoneNumber ?? 'Not set' },
                { Icon: MapPin, label: 'Address',   value: profile?.address ?? 'Not set' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#0A2D5E]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
            <Key className="w-4 h-4 text-[#0A2D5E]" />
          </div>
          <p className="font-semibold text-slate-900">Change Password</p>
        </div>
        <div className="p-6">
          <Form {...pwdForm}>
            <form onSubmit={pwdForm.handleSubmit(d => changePassword.mutate(d))} className="space-y-4">
              <FormField control={pwdForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600">Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} className="h-10 border-slate-200 pr-9 text-sm" {...field} />
                      <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={pwdForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showNewPwd ? "text" : "password"} className="h-10 border-slate-200 pr-9 text-sm" {...field} />
                      <button type="button" onClick={() => setShowNewPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={pwdForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600">Confirm New Password</FormLabel>
                  <FormControl><Input type="password" className="h-10 border-slate-200 text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full bg-[#0A2D5E] hover:bg-[#051A3E] text-white text-sm h-9" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating…' : <><Lock className="w-3.5 h-3.5 mr-1.5" /> Update Password</>}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Security section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#0A2D5E]" />
          </div>
          <p className="font-semibold text-slate-900">Security & Privacy</p>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Two-Factor Authentication', sub: 'Enabled via email', status: 'active' },
            { label: 'Login Alerts', sub: 'Email notifications enabled', status: 'active' },
            { label: 'Trusted Devices', sub: '2 devices registered', status: 'info' },
          ].map(({ label, sub, status }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
              <Badge className={`text-[10px] border-0 ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F0F4FF] text-[#0A2D5E]'}`}>
                {status === 'active' ? '✓ On' : 'Manage'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <LogOut className="w-4 h-4" /> Sign Out of Online Banking
      </button>
    </div>
  );
}
