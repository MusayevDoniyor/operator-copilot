"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSocket } from "@/stores/socket-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Users,
  Phone,
  Clock,
  TrendingUp,
  AlertTriangle,
  Activity,
  User,
  ShieldCheck,
  ChevronRight,
  Target,
  BarChart3,
  Calendar,
  LogOut,
  Sparkles,
  Search,
} from "lucide-react";
import { OperatorStatus, AdminDashboardData } from "@sadoo/types";

export default function AdminDashboard() {
  const { user, logout, token } = useAuthStore();
  const { socket } = useSocket("admin");
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [operators, setOperators] = useState<OperatorStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const [dashRes, opsRes] = await Promise.all([
          fetch("http://localhost:3001/dashboard/admin", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3001/auth/operators", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        
        if (dashRes.ok) setDashboardData(await dashRes.json());
        if (opsRes.ok) {
           const ops = await opsRes.json();
           setOperators(ops);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(true); // Keeping it true for a moment for a smooth transition
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    fetchData();

    if (socket) {
      socket.on("admin:dashboard_data", (data: AdminDashboardData) => setDashboardData(data));
      socket.on("operator:status_update", (status: OperatorStatus) => {
        setOperators((prev) => {
          const index = prev.findIndex((o) => o.userId === status.userId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = status;
            return updated;
          }
          return [...prev, status];
        });
      });
    }

    return () => {
      socket?.off("admin:dashboard_data");
      socket?.off("operator:status_update");
    };
  }, [socket, token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "on_call": return "bg-blue-50 text-blue-600 border-blue-100";
      case "busy": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Syncing Neural Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 overflow-hidden">
      {/* ── Left Sidebar ── */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-8 space-y-8">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-xl shadow-blue-100">
                A
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">Admin Panel</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Master Control</p>
              </div>
           </div>

           <nav className="space-y-2">
             {[
               { icon: BarChart3, label: "Analytics", active: true },
               { icon: Users, label: "Operator Fleet", active: false },
               { icon: Activity, label: "Live Monitor", active: false },
               { icon: ShieldCheck, label: "Compliance", active: false },
             ].map((item, i) => (
               <Button key={i} variant={item.active ? "secondary" : "ghost"} className={`w-full justify-start h-12 rounded-xl text-xs font-black tracking-widest uppercase gap-3 ${item.active ? "bg-slate-50 text-blue-600" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all transition-duration-300"}`}>
                 <item.icon className="h-4 w-4" />
                 {item.label}
               </Button>
             ))}
           </nav>
        </div>

        <div className="mt-auto p-8">
           <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black text-xs tracking-widest uppercase gap-3" onClick={logout}>
             <LogOut className="h-4 w-4" />
             LOGOUT SESSION
           </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/30">
        <header className="h-24 px-10 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-[5]">
           <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-[0.1em]">Dashboard Overview</h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-600" />
                <p className="text-xs font-black text-slate-600 uppercase tracking-tight">April 26, 2026</p>
              </div>
           </div>
        </header>

        <div className="p-10 space-y-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-8">
             {[
               { label: "Active Calls", value: dashboardData?.platformStats.activeCalls || 0, icon: Phone, color: "text-blue-600", bg: "bg-blue-50" },
               { label: "Fleet Capacity", value: `${operators.filter(o => o.isOnline).length}/${operators.length}`, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
               { label: "Avg Handle Time", value: `${dashboardData?.platformStats.avgWaitTime || 0}s`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
               { label: "Quality Index", value: "94%", icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
             ].map((stat, i) => (
               <Card key={i} className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[32px] overflow-hidden group hover:translate-y-[-4px] transition-all">
                 <CardContent className="p-8 flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-800 leading-tight">{stat.value}</p>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                 </CardContent>
               </Card>
             ))}
          </div>

          <div className="grid grid-cols-3 gap-10">
            {/* Operator Monitoring */}
            <div className="col-span-2 space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Activity className="h-4 w-4 text-blue-600" /> LIVE FLEET STATUS
                 </h3>
                 <Badge className="bg-blue-50 text-blue-600 border-none font-black px-3 py-1 rounded-lg">LIVE MONITORING ACTIVE</Badge>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 {operators.map((op, i) => (
                   <Card key={i} className="border-none shadow-sm rounded-3xl group hover:shadow-md transition-all border border-slate-100 overflow-hidden bg-white">
                     <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                {op.username[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">{op.username}</p>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Agent ID: {op.userId.slice(0, 8)}</p>
                              </div>
                           </div>
                           <Badge className={`${getStatusColor(op.status)} px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest`}>
                             {op.status}
                           </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-50">
                           <div className="text-center flex-1">
                             <p className="text-lg font-black text-slate-800">{op.callsToday || 0}</p>
                             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">CALLS TODAY</p>
                           </div>
                           <div className="w-[1px] h-8 bg-slate-100" />
                           <div className="text-center flex-1">
                             <p className="text-lg font-black text-blue-600">98%</p>
                             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">COMPLIANCE</p>
                           </div>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            </div>

            {/* Performance Insights */}
            <div className="space-y-6">
               <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                 <TrendingUp className="h-4 w-4 text-emerald-600" /> TOP PERFORMANCE
               </h3>
               
               <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[40px] overflow-hidden bg-white border border-slate-100">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-6">
                       <Sparkles className="h-5 w-5 text-amber-500" />
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Leaderboard FLEET-A</p>
                    </div>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 space-y-6">
                    {operators.slice(0, 4).sort((a, b) => (b.callsToday || 0) - (a.callsToday || 0)).map((op, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? "bg-amber-50 text-amber-600" : i === 1 ? "bg-slate-50 text-slate-700" : "bg-orange-50 text-orange-600"}`}>
                              #{i + 1}
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-800">{op.username}</p>
                               <p className="text-[9px] font-bold text-slate-600 uppercase">Master Closer</p>
                            </div>
                         </div>
                         <p className="text-sm font-black text-slate-800">{(op.callsToday || 0) * 1.5 + 85}%</p>
                      </div>
                    ))}
                  </CardContent>
                  <div className="p-8 bg-blue-600 text-white space-y-3 relative overflow-hidden">
                     <div className="relative z-10">
                       <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-2">Fleet Achievement</p>
                       <p className="text-lg font-black leading-tight">Your fleet has reached 92% compliance today. Keep pushing!</p>
                     </div>
                     <Activity className="absolute bottom-[-20px] right-[-20px] h-32 w-32 text-white/10" />
                  </div>
               </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
