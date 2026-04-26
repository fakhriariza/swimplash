"use client";

import { useEffect, useState } from "react";
import { getBranches, createBranch, Branch } from "@/lib/firebase/branches_classes";
import { Card, Button, Input } from "@/components/ui";
import { Plus, MapPin, Phone, Save, Loader2 } from "lucide-react";

export default function BranchesSettingsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: ""
  });

  const fetchBranches = async () => {
    const data = await getBranches();
    setBranches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createBranch({
        ...formData,
        isActive: true
      });
      setFormData({ name: "", address: "", phone: "" });
      setShowAdd(false);
      await fetchBranches();
    } catch (error) {
      alert("Gagal menambah cabang");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Daftar Cabang</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showAdd ? "Batal" : "Tambah Cabang"}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 border-blue-100 bg-blue-50/30">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input required placeholder="Nama Cabang" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <Input required placeholder="Alamat" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <Input required placeholder="No. Telp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Cabang
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p>Loading...</p>
        ) : branches.map((branch) => (
          <Card key={branch.id} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl text-slate-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{branch.name}</h3>
                <p className="text-sm text-slate-500">{branch.address}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                {branch.phone}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
