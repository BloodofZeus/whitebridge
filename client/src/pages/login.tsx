import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Lock, Smartphone, HelpCircle, ChevronRight } from "lucide-react";

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      setTimeout(() => {
        if (data.user?.role === "admin") setLocation("/admin");
        else setLocation("/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Invalid email or password. Please try again.",
      });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">

      {/* FSCS top info bar */}
      <div className="bg-[#EAECEF] border-b border-gray-300 text-[11px] text-gray-600 py-1.5 px-4 text-center">
        NorthBridge Capital Bank Ltd. deposit products &nbsp;·&nbsp;
        <span className="font-semibold text-[#0A2D5E]">FSCS</span>
        &nbsp;·&nbsp; Protected up to £85,000 per person
      </div>

      {/* White header bar */}
      <div className="bg-white border-b border-gray-200 py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0A2D5E] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="leading-tight text-left">
              <span className="font-bold text-[#0A2D5E] text-sm block leading-none">NorthBridge</span>
              <span className="text-[10px] text-[#C5003E] font-semibold tracking-wide uppercase block">Capital Bank Ltd.</span>
            </div>
          </button>

          <span className="text-[#0A2D5E] font-semibold text-sm hidden sm:block">Log In</span>

          <div className="flex items-center gap-1.5 text-[#0A2D5E] text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Area</span>
          </div>
        </div>
      </div>

      {/* Crimson red banner */}
      <div className="bg-[#C5003E] py-3 px-6 text-center">
        <h1 className="text-white text-base font-semibold tracking-wide">Log In to Online Banking</h1>
      </div>

      {/* 3-column content area */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left: Login form */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-[#0A2D5E] font-bold text-base mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C5003E]" /> Sign In
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          type="email"
                          autoComplete="email"
                          data-testid="input-email"
                          className="h-10 border-gray-300 focus:border-[#0A2D5E] focus:ring-[#0A2D5E]/20 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Password</FormLabel>
                        <button type="button" className="text-[11px] text-[#C5003E] hover:underline font-medium">
                          Forgot Password?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            data-testid="input-password"
                            className="h-10 border-gray-300 focus:border-[#0A2D5E] focus:ring-[#0A2D5E]/20 pr-10 text-sm"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input type="checkbox" className="rounded border-gray-300 accent-[#0A2D5E]" />
                  Save this User ID
                </label>

                <Button
                  type="submit"
                  className="w-full h-10 bg-[#0A2D5E] hover:bg-[#051A3E] text-white font-bold text-sm rounded transition-all"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Log In
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
              <p className="text-[11px] text-amber-800 font-semibold mb-1">Demo Credentials</p>
              <p className="text-[11px] text-amber-700">Admin: admin@admin.com / admin123</p>
              <p className="text-[11px] text-amber-700">Customer: john.doe@email.com / password123</p>
            </div>
          </div>

          {/* Centre: App promo */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#0A2D5E] rounded-2xl flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-[#0A2D5E] font-bold text-base mb-2">Stay connected with our app</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Secure, convenient banking anytime, anywhere. Check balances, transfer funds, and pay bills on the go.
            </p>

            <div className="w-28 h-48 bg-gradient-to-b from-[#0A2D5E] to-[#1E4A87] rounded-2xl border-4 border-[#0A2D5E] shadow-lg mb-6 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-1 bg-white/30 rounded-full" />
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1.5 w-full px-3">
                <div className="h-1.5 bg-white/20 rounded-full" />
                <div className="h-1.5 bg-white/15 rounded-full w-3/4 mx-auto" />
                <div className="h-1.5 bg-white/15 rounded-full w-2/3 mx-auto" />
              </div>
            </div>

            <Button className="w-full h-9 bg-[#C5003E] hover:bg-[#9E0031] text-white font-semibold text-sm">
              Get the app
            </Button>
            <p className="text-[11px] text-slate-400 mt-3">Available on iOS & Android</p>
          </div>

          {/* Right: Help links */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-[#0A2D5E] font-bold text-base mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#C5003E]" /> Login help
            </h2>

            <ul className="space-y-2 mb-6">
              {[
                "Forgot your User ID?",
                "Forgot your Password?",
                "Problem logging in?",
              ].map((item) => (
                <li key={item}>
                  <a href="/help" className="flex items-center gap-1.5 text-sm text-[#0A2D5E] hover:text-[#C5003E] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-slate-700 mb-3">Not using Online Banking?</p>
              <ul className="space-y-2">
                {[
                  { label: "Enrol in Online Banking", href: "/login" },
                  { label: "Learn more about Online Banking", href: "/services" },
                  { label: "Service Agreement", href: "/help" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="flex items-center gap-1.5 text-sm text-[#0A2D5E] hover:text-[#C5003E] transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Contact us</p>
              <p className="text-xs text-slate-500">📞 +44 161 850 4721</p>
              <p className="text-xs text-slate-500">✉ support@northbridgecapital.co.uk</p>
              <p className="text-xs text-slate-400 mt-1">Mon–Fri 8am–8pm GMT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secure gray footer */}
      <div className="bg-[#EAECEF] border-t border-gray-300 py-3 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Secure area — your information is protected with 256-bit SSL encryption</span>
          </div>
          <div className="flex gap-4">
            <a href="/help" className="hover:text-[#0A2D5E]">Privacy</a>
            <a href="/help" className="hover:text-[#0A2D5E]">Security</a>
            <a href="/help" className="hover:text-[#0A2D5E]">Your Privacy Choices</a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2 text-[10px] text-gray-400 text-center">
          FCA Authorised · FSCS Protected · NorthBridge Capital Bank Ltd. Registered in England and Wales No. 09284756 · FCA No. 778901
        </div>
      </div>
    </div>
  );
}
