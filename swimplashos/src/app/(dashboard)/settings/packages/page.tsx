"use client";

import { useEffect, useState } from "react";
import { getPackages, createPackage, Package } from "@/lib/firebase/packages";
import { Card, Button, Input } from "@/components/ui";
import { Plus, Box, Save, Loader2, DollarSign, Clock } from "lucide-react";

export default function PackagesSettingsPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    totalSessions: 8,
    price: 500000,
    description: ""
  });

  const fetchPackages = async () => {
    const data = await getPackages();
    setPackages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPackage({
        ...formData,
        isActive: true
      });
      setFormData({ name: "", totalSessions: 8, price: 500000, description: "" });
      setShowAdd(false);
      await fetchPackages();
    } catch (error: any) {
      console.error("Create package error:", error);
      alert("Gagal menambah paket: " + (error.message || "Terjadi kesalahan"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Paket Kursus</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showAdd ? "Batal" : "Tambah Paket"}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 border-blue-100 bg-blue-50/30">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input required placeholder="Nama Paket" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <Input required type="number" placeholder="Total Sesi" value={formData.totalSessions} onChange={e => setFormData({...formData, totalSessions: parseInt(e.target.value)})} />
            <Input required type="number" placeholder="Harga (IDR)" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} />
            <Input placeholder="Deskripsi (Opsional)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Paket
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : packages.map((pkg) => (
          <Card key={pkg.id} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Box className="w-6 h-6" />
              </div>
              <Badge variant="success">Aktif</Badge>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{pkg.name}</h3>
              <p className="text-sm text-slate-500">{pkg.description || "Tidak ada deskripsi."}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Sesi
                </p>
                <p className="font-bold text-slate-900">{pkg.totalSessions} Pertemuan</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Harga
                </p>
                <p className="font-bold text-slate-900">Rp {pkg.price.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode, variant: "success" }) {
  return (
    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-600">
      {children}
    </span>
  );
}
