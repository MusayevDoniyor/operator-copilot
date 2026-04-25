'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Phone,
  TrendingUp,
  Trophy,
  Clock,
  Activity,
  Eye,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [operators, setOperators] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [formulaLeaderboard, setFormulaLeaderboard] = useState<any[]>([]);
  const [operatorLeaderboard, setOperatorLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/operator');
      return;
    }

    // Fetch admin data
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/dashboard/admin', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators);
        setStats(data.platformStats);
        setFormulaLeaderboard(data.formulaLeaderboard);
        setOperatorLeaderboard(data.operatorLeaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'on_call': return 'bg-amber-500';
      case 'busy': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-background-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg">SADOO Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.activeCalls || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Queue Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.queueDepth || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Calls Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalCallsToday || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Math.round((stats?.conversionRate || 0) * 100)}%</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="operators">
            <TabsList className="mb-4">
              <TabsTrigger value="operators">Operators</TabsTrigger>
              <TabsTrigger value="formulas">Formulas</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="operators">
              <Card>
                <CardHeader>
                  <CardTitle>Operator Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {operators.map((op) => (
                      <div key={op.userId} className="flex items-center justify-between p-3 border border-background-border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(op.status)}`} />
                          <span className="font-medium">{op.username}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Calls: {op.callsToday}</span>
                          {op.currentCallId && (
                            <Badge variant="warning">On Call</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="formulas">
              <Card>
                <CardHeader>
                  <CardTitle>Formula Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formulaLeaderboard.map((formula) => (
                      <div key={formula.formulaId} className="flex items-center justify-between p-3 border border-background-border rounded-md">
                        <div>
                          <p className="font-medium">{formula.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{formula.category}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={formula.successRate > 0.6 ? 'success' : formula.successRate > 0.4 ? 'warning' : 'destructive'}>
                            {Math.round(formula.successRate * 100)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">{formula.usageCount} uses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-warning" />
                      Operators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {operatorLeaderboard.map((op, i) => (
                        <div key={op.userId} className="flex items-center justify-between p-2 border border-background-border rounded">
                          <span className="font-medium">#{i + 1} {op.username}</span>
                          <span className="text-sm">{Math.round(op.conversionRate * 100)}% conv.</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    </div>
  );
}
