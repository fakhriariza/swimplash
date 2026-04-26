"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { Users, CheckSquare, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { getDashboardStats, getAnalyticsData } from "@/lib/firebase/dashboard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, a] = await Promise.all([
          getDashboardStats(profile?.branchId),
          getAnalyticsData()
        ]);
        setStats(s);
        setChartData(a);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  if (loading) return <div className="p-12 text-center">Loading dashboard...</div>;

  const statCards = [
    { name: "Total Murid", value: stats?.totalStudents || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Sesi Hari Ini", value: stats?.sessionsToday || 0, icon: CheckSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Revenue (Bulan Ini)", value: `Rp ${(stats?.monthlyRevenue || 0).toLocaleString('id-ID')}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Pemberitahuan", value: stats?.activeAlerts || 0, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Overview</h1>
        <p className="text-slate-500 mt-1">Pantau performa bisnis Swimplash Anda secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name} className="p-6 hover:shadow-lg transition-all duration-300 border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-4 rounded-2xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Revenue & Expense</h2>
              <p className="text-sm text-slate-500">Perbandingan pemasukan dan pengeluaran</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <RevenueChart data={chartData} />
        </Card>

        <Card className="p-8 border-none shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profit Trend</h2>
              <p className="text-sm text-slate-500">Pertumbuhan laba bersih per bulan</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <ProfitChart data={chartData} />
        </Card>
      </div>
    </div>
  );
}
