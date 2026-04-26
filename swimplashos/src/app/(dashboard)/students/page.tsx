"use client";

import { useEffect, useState } from "react";
import { getStudents, Student } from "@/lib/firebase/students";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Badge } from "@/components/ui";
import { Plus, Search, User, Phone, MapPin, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

export default function StudentsPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const data = await getStudents(profile?.branchId);
      setStudents(data);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Murid</h1>
          <p className="text-slate-500 mt-1">Kelola seluruh data siswa dan status paket aktif mereka.</p>
        </div>
        <Link href="/students/new">
          <Button className="gap-2 shadow-lg shadow-blue-100 h-12 px-6">
            <Plus className="w-5 h-5" /> Tambah Murid
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama murid atau orang tua..." 
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 rounded-2xl gap-2 border-slate-100 bg-white">
          <Filter className="w-5 h-5 text-slate-400" /> Filter
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Murid</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Orang Tua</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Sesi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. WA</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Memuat data...</td></tr>
              ) : filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <Link href={`/students/${s.id}`} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs shadow-inner uppercase">
                        {s.name[0]}
                      </div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{s.parentName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <Badge variant={s.activePackage.status === "active" ? "success" : "warning"} size="xs">
                        {s.activePackage.totalSessions - s.activePackage.usedSessions} Sesi
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                      <Phone className="w-3 h-3" /> {s.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/students/${s.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        Detail <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada data ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
