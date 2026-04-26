"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Badge } from "@/components/ui";
import { ArrowLeft, UserRound, Phone, Wallet, Calendar, CheckCircle2, Share2, Clock, List } from "lucide-react";
import Link from "next/link";

interface TrainerSession {
  id: string;
  month: string;
  totalSessions: number;
  ratePerSession: number;
  totalSalary: number;
  isPaid: boolean;
  paidAt?: Timestamp;
}

interface AttendanceLog {
  id: string;
  date: Timestamp;
  classId: string;
}

export default function TrainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trainer, setTrainer] = useState<any>(null);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const fetchTrainerData = async () => {
    try {
      const tenantId = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();
      const tDoc = await getDoc(doc(db, "tenants", tenantId, "trainers", id));
      
      if (tDoc.exists()) {
        setTrainer(tDoc.data());
        
        // Fetch Salary Summaries
        const sQuery = query(collection(db, "tenants", tenantId, "trainer_sessions"), where("trainerId", "==", id));
        const sSnapshot = await getDocs(sQuery);
        setSessions(sSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainerSession)));

        // Fetch Detailed Attendance Logs
        const aQuery = query(collection(db, "tenants", tenantId, "attendance"), where("trainerId", "==", id));
        const aSnapshot = await getDocs(aQuery);
        setAttendanceLogs(aSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog)));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerData();
  }, [id]);

  const handleMarkAsPaid = async (sessionId: string, amount: number) => {
    setPaying(sessionId);
    try {
      const tenantId = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();
      const sessionRef = doc(db, "tenants", tenantId, "trainer_sessions", sessionId);
      
      await updateDoc(sessionRef, {
        isPaid: true,
        paidAt: Timestamp.now()
      });

      // Create Finance Record
      await addDoc(collection(db, "tenants", tenantId, "finance"), {
        date: Timestamp.now(),
        type: "expense",
        category: "gaji_pelatih",
        amount: amount,
        branchId: trainer.branchId,
        description: `Gaji pelatih ${trainer.name} - ${sessions.find(s => s.id === sessionId)?.month}`,
        referenceId: sessionId,
        createdAt: Timestamp.now()
      });

      await fetchTrainerData();
    } catch (error) {
      alert("Gagal memproses pembayaran");
    } finally {
      setPaying(null);
    }
  };

  const shareSlipWA = (session: TrainerSession) => {
    // Filter attendance logs for this specific month
    const monthLogs = attendanceLogs
      .filter(log => {
        const logDate = log.date.toDate();
        const logMonth = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
        return logMonth === session.month;
      })
      .sort((a, b) => a.date.seconds - b.date.seconds);

    const dateList = monthLogs.map((log, index) => {
      const dateStr = log.date.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${index + 1}. ${dateStr}`;
    }).join('\n');

    const slipUrl = `${window.location.origin}/slip/${session.id}`;

    const msg = `Halo *${trainer.name}*, berikut rekap gaji Anda bulan *${session.month}*:\n\n` +
      `📅 *Daftar Sesi:*\n${dateList}\n\n` +
      `• Total Sesi: ${session.totalSessions}\n` +
      `• Rate/Sesi: Rp ${session.ratePerSession.toLocaleString('id-ID')}\n` +
      `• Total Gaji: *Rp ${session.totalSalary.toLocaleString('id-ID')}*\n` +
      `• Status: *${session.isPaid ? 'LUNAS' : 'BELUM DIBAYAR'}*\n\n` +
      `Link Slip Digital: ${slipUrl}\n\n` +
      `Terima kasih! 🏊‍♂️`;
    
    window.open(`https://wa.me/${trainer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading details...</div>;
  if (!trainer) return <div className="p-12 text-center">Trainer not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/trainers"><Button variant="ghost"><ArrowLeft /></Button></Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 text-center h-fit border-none shadow-sm space-y-4">
          <div className="w-24 h-24 bg-purple-100 rounded-[2rem] flex items-center justify-center mx-auto text-purple-600 shadow-inner">
            <UserRound className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{trainer.name}</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">{trainer.phone}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tarif Per Sesi</p>
            <p className="text-xl font-black text-slate-900">Rp {trainer.ratePerSession.toLocaleString('id-ID')}</p>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="text-blue-600 w-6 h-6" /> Rekap Gaji & Sesi
          </h3>
          
          <div className="space-y-4">
            {sessions.sort((a, b) => b.month.localeCompare(a.month)).map((session) => (
              <Card key={session.id} className="p-8 border-none shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                      <Calendar className="w-5 h-5 text-blue-600" /> {session.month}
                    </p>
                    <p className="text-xs font-bold text-slate-400">{session.totalSessions} Sesi Terlaksana</p>
                  </div>
                  <Badge variant={session.isPaid ? "success" : "warning"}>{session.isPaid ? "Lunas" : "Menunggu Pembayaran"}</Badge>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <List className="w-3 h-3" /> Rincian Sesi
                  </p>
                  <div className="space-y-1">
                    {attendanceLogs
                      .filter(log => {
                        const d = log.date.toDate();
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === session.month;
                      })
                      .sort((a, b) => a.date.seconds - b.date.seconds)
                      .map((log, idx) => (
                        <div key={log.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl text-xs">
                          <span className="font-bold text-slate-600">Sesi #{idx + 1} - {log.date.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <span className="font-black text-blue-600">Rp {session.ratePerSession.toLocaleString('id-ID')}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-slate-50 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Penghasilan</p>
                    <p className="text-3xl font-black text-slate-900">Rp {session.totalSalary.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 h-11 px-6 rounded-xl border-slate-200"
                      onClick={() => shareSlipWA(session)}
                    >
                      <Share2 className="w-4 h-4" /> Slip WA
                    </Button>

                    {!session.isPaid && (
                      <Button 
                        size="sm" 
                        className="gap-2 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                        onClick={() => handleMarkAsPaid(session.id, session.totalSalary)}
                        disabled={paying === session.id}
                      >
                        {paying === session.id ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Tandai Lunas
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {sessions.length === 0 && (
              <Card className="p-12 text-center text-slate-400 italic border-dashed border-2 bg-transparent">
                Belum ada catatan gaji untuk pelatih ini.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
