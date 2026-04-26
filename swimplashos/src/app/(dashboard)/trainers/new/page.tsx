"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTrainer } from "@/lib/firebase/trainers";
import { getBranches, Branch } from "@/lib/firebase/branches_classes";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input, Select } from "@/components/ui";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewTrainerPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    branchId: profile?.branchId || "",
    ratePerSession: 50000,
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
    setLoading(true);

    try {
      await createTrainer({
        name: formData.name,
        phone: formData.phone,
        branchId: formData.branchId,
        ratePerSession: formData.ratePerSession,
        isActive: true,
      });

      router.push("/trainers");
    } catch (error: any) {
      alert(error.message || "Gagal menambah pelatih");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trainers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Tambah Pelatih Baru</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nama Pelatih</label>
            <Input 
              required 
              placeholder="Contoh: Coach Andi"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">No. WhatsApp</label>
            <Input 
              required 
              placeholder="0812xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cabang</label>
              <Select 
                required
                value={formData.branchId}
                onChange={(e) => setFormData({...formData, branchId: e.target.value})}
              >
                <option value="">Pilih Cabang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tarif Per Sesi (IDR)</label>
              <Input 
                type="number"
                required
                min="0"
                step="1000"
                value={formData.ratePerSession}
                onChange={(e) => setFormData({...formData, ratePerSession: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 shadow-lg shadow-blue-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Simpan Pelatih
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
