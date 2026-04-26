"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { createTransaction } from "@/lib/firebase/finance";
import { getBranches, Branch } from "@/lib/firebase/branches_classes";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input, Select } from "@/components/ui";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewTransactionPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "income" as "income" | "expense",
    category: "lainnya",
    amount: 0,
    branchId: profile?.branchId || "",
    description: "",
  });

  useEffect(() => {
    const fetchBranches = async () => {
      const data = await getBranches();
      setBranches(data);
    };
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await createTransaction({
        date: Timestamp.fromDate(new Date(formData.date)),
        type: formData.type,
        category: formData.category as any,
        amount: formData.amount,
        branchId: formData.branchId,
        description: formData.description,
        createdBy: user.uid,
      });

      router.push("/finance");
    } catch (error: any) {
      alert(error.message || "Gagal menambah transaksi");
    } finally {
      setLoading(false);
    }
  };

  const categories = {
    income: ["paket_murid", "lainnya"],
    expense: ["gaji_pelatih", "operasional", "lainnya"]
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Catat Transaksi</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: "income", category: "paket_murid"})}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: "expense", category: "operasional"})}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"}`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tanggal</label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nominal (IDR)</label>
              <Input type="number" required min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Kategori</label>
            <Select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as any})}
            >
              {categories[formData.type].map(c => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Keterangan</label>
            <Input required placeholder="Contoh: Pembayaran listrik" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Cabang</label>
            <Select 
              required
              value={formData.branchId}
              onChange={e => setFormData({...formData, branchId: e.target.value})}
            >
              <option value="">Pilih Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Simpan Transaksi
          </Button>
        </Card>
      </form>
    </div>
  );
}
