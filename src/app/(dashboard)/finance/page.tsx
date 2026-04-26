"use client";

import { useEffect, useState } from "react";
import { getTransactions, Transaction } from "@/lib/firebase/finance";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Badge } from "@/components/ui";
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const data = await getTransactions(profile?.role === "super_admin" ? undefined : profile?.branchId);
        setTransactions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, [profile]);

  const totals = transactions.reduce((acc, curr) => {
    if (curr.type === "income") acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Keuangan</h1>
          <p className="text-slate-500 text-sm">Monitor arus kas dan laporan transaksi.</p>
        </div>
        <Link href="/finance/new"><Button className="gap-2"><Plus className="w-5 h-5" /> Transaksi Baru</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-blue-600 text-white">
          <div className="flex items-center gap-3 mb-2"><ArrowUpCircle className="w-5 h-5 text-blue-200" /> <span className="text-sm font-medium">Total Pemasukan</span></div>
          <p className="text-2xl font-black">Rp {totals.income.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-6 bg-rose-600 text-white">
          <div className="flex items-center gap-3 mb-2"><ArrowDownCircle className="w-5 h-5 text-rose-200" /> <span className="text-sm font-medium">Total Pengeluaran</span></div>
          <p className="text-2xl font-black">Rp {totals.expense.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-6 bg-emerald-600 text-white">
          <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-emerald-200" /> <span className="text-sm font-medium">Profit</span></div>
          <p className="text-2xl font-black">Rp {(totals.income - totals.expense).toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Tanggal</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Kategori</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Keterangan</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-sm text-slate-600">{t.date.toDate().toLocaleDateString('id-ID')}</td>
                  <td className="p-4"><Badge variant={t.type === "income" ? "success" : "error"} size="xs">{t.category.replace("_", " ")}</Badge></td>
                  <td className="p-4 text-sm font-medium text-slate-900">{t.description}</td>
                  <td className={`p-4 text-sm font-bold text-right ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "income" ? "+" : "-"} Rp {t.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
