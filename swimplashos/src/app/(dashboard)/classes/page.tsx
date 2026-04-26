"use client";

import { useEffect, useState } from "react";
import { getClasses, Class } from "@/lib/firebase/branches_classes";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Modal, Badge } from "@/components/ui";
import { Calendar as CalendarIcon, Plus, Clock, User, MessageCircle, Users as UsersIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const DAYS_NAME = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ClassesPage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date State for navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [trainerName, setTrainerName] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getClasses(profile?.branchId);
        setClasses(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [profile]);

  // Helper to get dates of the week
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(currentDate);

  const handleOpenDetail = async (c: Class) => {
    setSelectedClass(c);
    setIsModalOpen(true);
    setModalLoading(true);
    setStudents([]);
    setTrainerName("");

    try {
      const tenantId = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();
      const trainerSnap = await getDoc(doc(db, "tenants", tenantId, "trainers", c.trainerId));
      if (trainerSnap.exists()) setTrainerName(trainerSnap.data().name);

      const q = query(collection(db, "tenants", tenantId, "students"), where("classId", "==", c.id));
      const studentSnap = await getDocs(q);
      setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const sendReminder = (student: any) => {
    const msg = `Halo *${student.name}*, ini pengingat untuk jadwal renang Anda hari ini di kelas *${selectedClass?.name}* jam *${selectedClass?.timeStart}*. Sampai jumpa di kolam! 🏊‍♂️`;
    window.open(`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const classesByDay = (dayId: number) => {
    return classes
      .filter((c) => c.dayOfWeek === dayId)
      .sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  };

  const navigateWeek = (direction: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(nextDate);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-blue-600 w-8 h-8" />
            Jadwal Sesi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor seluruh jadwal sesi renang berdasarkan tanggal.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-100 rounded-xl p-1 shadow-sm mr-2">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)} className="h-8 w-8 p-0 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
            <div className="px-3 flex items-center text-xs font-bold text-slate-600">
              {weekDates[0].toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)} className="h-8 w-8 p-0 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Link href="/classes/new">
            <Button className="gap-2 shadow-lg shadow-blue-100 h-11 px-5 text-sm">
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading schedule...</div>
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="min-w-[1200px] grid grid-cols-7 gap-4">
            {weekDates.map((date) => {
              const dayId = date.getDay();
              const isToday = new Date().toDateString() === date.toDateString();
              
              return (
                <div key={date.toString()} className="space-y-4">
                  <div className={`p-4 rounded-2xl border text-center transition-all ${isToday ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-100" : "bg-white border-slate-100 shadow-sm"}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-blue-100" : "text-slate-400"}`}>
                      {DAYS_NAME[dayId]}
                    </p>
                    <p className={`text-xl font-black ${isToday ? "text-white" : "text-slate-900"}`}>
                      {date.getDate()}
                    </p>
                  </div>
                  
                  <div className="space-y-3 min-h-[400px] bg-slate-50/50 rounded-[2rem] p-3 border border-slate-100/50">
                    {classesByDay(dayId).map((c) => (
                      <div key={c.id} onClick={() => handleOpenDetail(c)}>
                        <Card className="p-4 border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <Clock className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {c.timeStart}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-slate-900 text-xs mb-1 truncate leading-tight">{c.name}</h4>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            <UsersIcon className="w-2.5 h-2.5" /> 10 Slots
                          </div>
                        </Card>
                      </div>
                    ))}
                    
                    {classesByDay(dayId).length === 0 && (
                      <div className="py-8 text-center">
                        <span className="text-[10px] font-bold text-slate-200 uppercase italic">Tidak ada sesi</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedClass?.name}>
        {modalLoading ? (
          <div className="p-12 text-center text-slate-400">Memuat detail kelas...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pelatih</p>
                <p className="font-bold text-slate-900">{trainerName || "Unknown"}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Waktu Sesi</p>
                <p className="font-bold text-slate-900">{selectedClass?.timeStart} - {selectedClass?.timeEnd}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-slate-400" /> Daftar Murid ({students.length})
              </h3>
              <div className="space-y-2">
                {students.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">
                        {s.activePackage.totalSessions - s.activePackage.usedSessions} Sesi Tersisa
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 text-emerald-600 border-emerald-100 h-9"
                      onClick={() => sendReminder(s)}
                    >
                      <MessageCircle className="w-4 h-4" /> Hubungi
                    </Button>
                  </div>
                ))}
                {students.length === 0 && <p className="text-xs text-slate-400 italic p-4 text-center">Belum ada murid di kelas ini.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
