"use client";

import { useEffect, useState } from "react";
import { getClasses, Class } from "@/lib/firebase/branches_classes";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Badge } from "@/components/ui";
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const DAYS_NAME = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function AttendancePage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Get current day of selected date
  const selectedDayId = selectedDate.getDay();
  
  // Filter classes for the selected date's day of week
  const dayClasses = classes
    .filter((c) => c.dayOfWeek === selectedDayId)
    .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  if (loading) return <div className="p-12 text-center text-slate-400">Loading session schedule...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Input Absensi</h1>
          <p className="text-slate-500 mt-1">Pilih jadwal kelas berdasarkan tanggal untuk mencatat kehadiran.</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => changeDate(-1)} className="h-10 w-10 p-0 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="px-6 text-center min-w-[180px]">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">
              {isToday ? "Hari Ini" : DAYS_NAME[selectedDayId]}
            </p>
            <p className="text-sm font-bold text-slate-900">
              {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={() => changeDate(1)} className="h-10 w-10 p-0 rounded-xl">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Jadwal Sesi: {DAYS_NAME[selectedDayId]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dayClasses.map((c) => (
            <Card key={c.id} className="p-6 hover:shadow-xl transition-all border-none shadow-sm flex flex-col justify-between group bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <Badge variant="info" className="px-3 py-1 font-bold">
                    {c.timeStart} - {c.timeEnd}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{c.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">Klik untuk mengabsen murid hari ini.</p>
                </div>
              </div>
              
              <div className="mt-8">
                <Link href={`/attendance/session/${c.id}`} className="block">
                  <Button className="w-full h-12 justify-between group/btn shadow-lg shadow-blue-100 rounded-xl">
                    Mulai Absensi
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {dayClasses.length === 0 && (
          <Card className="p-20 text-center border-dashed border-2 bg-slate-50/30 rounded-[3rem]">
            <div className="max-w-xs mx-auto space-y-2">
              <p className="text-slate-400 font-bold">Tidak ada jadwal.</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak ada kelas yang dijadwalkan pada hari {DAYS_NAME[selectedDayId]}. Silakan pilih tanggal lain atau cek menu Jadwal Kelas.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
