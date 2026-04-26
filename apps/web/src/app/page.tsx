"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "../stores/auth-store";
import { ShieldCheck, Lock, User as UserIcon, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { login, user, isHydrated } = useAuthStore();
  
  useEffect(() => {
    if (isHydrated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/operator');
      }
    }
  }, [isHydrated, user, router]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();
      login(data.accessToken, data.user);
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/operator");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 selection:bg-blue-100 font-sans">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
           <div className="mx-auto h-16 w-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-blue-100 mb-6">
              <ShieldCheck className="h-8 w-8" />
           </div>
           <h1 className="text-3xl font-black tracking-tighter text-slate-900">SADOO <span className="text-blue-600 font-medium">COPILOT</span></h1>
           <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Next-Gen Banking OS</p>
        </div>

        <Card className="border-none shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">Access ID</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">Security Key</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 animate-bounce-subtle">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <p className="text-rose-600 text-xs font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 transition-all text-sm group" disabled={loading}>
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    SECURE SIGN IN
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-50">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Sparkles className="h-3.5 w-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Training Access Assets</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { role: "Admin", user: "admin", pass: "admin123" },
                  { role: "Operator", user: "otabeklv", pass: "qwerty_654321" },
                ].map((cred, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-700 uppercase tracking-tighter w-16">{cred.role}</span>
                    <div className="flex gap-4">
                      <span className="text-slate-600">ID: <span className="text-slate-800 font-bold">{cred.user}</span></span>
                      <span className="text-slate-600">KEY: <span className="text-slate-800 font-bold">{cred.pass}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-[10px] text-center font-bold text-slate-300 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
      </div>
    </div>
  );
}
