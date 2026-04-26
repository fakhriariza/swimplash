"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClass, getBranches, Branch } from "@/lib/firebase/branches_classes";
import { getTrainers, Trainer } from "@/lib/firebase/trainers";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input, Select } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewClassPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    branchId: profile?.branchId || "",
    trainerId: "",
    dayOfWeek: "1",
    timeStart: "08:00",
    timeEnd: "09:00",
    maxCapacity: 10,
  });

  useEffect(() => {
    const fetch = async () => {
      const b = await getBranches();
      setBranches(b);
      if (formData.branchId) {
        const t = await getTrainers(formData.branchId);
        setTrainers(t);
      }
    };
    fetch();
  }, [formData.branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createClass({
        name: formData.name,
        branchId: formData.branchId,
        trainerId: formData.trainerId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        maxCapacity: formData.maxCapacity,
        studentIds: [],
        isActive: true
      });
      router.push("/classes");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/classes"><Button variant="ghost"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Buat Kelas Baru</h1>
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input required placeholder="Nama Kelas" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value, trainerId: ""})}>
            <option value="">Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select required value={formData.trainerId} onChange={e => setFormData({...formData, trainerId: e.target.value})} disabled={!formData.branchId}>
            <option value="">Pelatih</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select required value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}>
            <option value="1">Senin</option>
            <option value="2">Selasa</option>
            <option value="3">Rabu</option>
            <option value="4">Kamis</option>
            <option value="5">Jumat</option>
            <option value="6">Sabtu</option>
            <option value="0">Minggu</option>
          </Select>
          <Input required type="number" placeholder="Kapasitas" value={formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value)})} />
          <div className="grid grid-cols-2 gap-4">
            <Input required type="time" value={formData.timeStart} onChange={e => setFormData({...formData, timeStart: e.target.value})} />
            <Input required type="time" value={formData.timeEnd} onChange={e => setFormData({...formData, timeEnd: e.target.value})} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Saving..." : "Simpan Kelas"}</Button>
        </form>
      </Card>
    </div>
  );
}
