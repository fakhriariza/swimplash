"use client";

import { useEffect, useState } from "react";
import { getTrainers, Trainer } from "@/lib/firebase/trainers";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Badge } from "@/components/ui";
import { Plus, UserRound, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { getBranches, Branch } from "@/lib/firebase/branches_classes";

export default function TrainersPage() {
  const { profile } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tData, bData] = await Promise.all([
          getTrainers(profile?.role === "super_admin" ? undefined : profile?.branchId),
          getBranches()
        ]);
        setTrainers(tData);
        setBranches(bData);
      } catch (error) {
        console.error("Error fetching trainers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pelatih</h1>
          <p className="text-slate-500 text-sm">Kelola daftar pelatih dan tarif sesi mereka.</p>
        </div>
        <Link href="/trainers/new">
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Tambah Pelatih
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-slate-50" />)
        ) : trainers.map((trainer) => (
          <Link key={trainer.id} href={`/trainers/${trainer.id}`}>
            <Card className="p-6 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <UserRound className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{trainer.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {branches.find(b => b.id === trainer.branchId)?.name}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {trainer.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarif Sesi</span>
                  <span className="text-sm font-bold text-slate-900">
                    Rp {trainer.ratePerSession.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!loading && trainers.length === 0 && (
        <Card className="p-12 text-center border-dashed border-2 bg-transparent">
          <p className="text-slate-500">Belum ada pelatih terdaftar.</p>
        </Card>
      )}
    </div>
  );
}
