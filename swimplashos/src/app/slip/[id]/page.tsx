"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, Badge, Button } from "@/components/ui";
import { Printer, Download, Waves, CheckCircle2, Calendar, Wallet, List } from "lucide-react";

export default function TrainerSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const tenantId = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();
        
        // 1. Get Session Data
        const sSnap = await getDoc(doc(db, "tenants", tenantId, "trainer_sessions", id));
        if (sSnap.exists()) {
          const sData = sSnap.data();
          setSession(sData);

          // 2. Get Trainer Data
          const tSnap = await getDoc(doc(db, "tenants", tenantId, "trainers", sData.trainerId));
          if (tSnap.exists()) setTrainer(tSnap.data());

          // 3. Get Attendance Logs
          const aQuery = query(
            collection(db, "tenants", tenantId, "attendance"), 
            where("trainerId", "==", sData.trainerId)
          );
          const aSnap = await getDocs(aQuery);
          const monthLogs = aSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((log: any) => {
              const d = log.date.toDate();
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === sData.month;
            })
            .sort((a: any, b: any) => a.date.seconds - b.date.seconds);
          setLogs(monthLogs);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-slate-400">Loading slip...</div>;
  if (!session || !trainer) return <div className="p-12 text-center text-rose-500">Slip data not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
      <Card className="max-w-3xl w-full p-8 md:p-12 border-none shadow-2xl space-y-8 relative overflow-hidden bg-white">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 rounded-bl-[4rem] -mr-16 -mt-16" />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-2xl text-blue-600"><Waves className="w-8 h-8" /> SwimplashOS</div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Slip Gaji Pelatih</h1>
              <p className="text-slate-400 font-bold text-sm tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4" /> PERIODE {session.month}
              </p>
            </div>
          </div>
          <Badge variant={session.isPaid ? "success" : "warning"} className="px-6 py-2 text-xs font-black uppercase tracking-widest">
            {session.isPaid ? "SUDAH DIBAYAR" : "MENUNGGU PEMBAYARAN"}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-slate-100">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Informasi Pelatih</p>
            <h3 className="text-xl font-bold text-slate-900">{trainer.name}</h3>
            <p className="text-sm text-slate-500 font-medium">{trainer.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ringkasan</p>
            <h3 className="text-xl font-bold text-slate-900">{session.totalSessions} Sesi</h3>
            <p className="text-sm text-blue-600 font-bold mt-1">@ Rp {session.ratePerSession.toLocaleString('id-ID')} / sesi</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <List className="w-4 h-4 text-purple-600" /> Rincian Pertemuan
          </h4>
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Sesi</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log, index) => (
                  <tr key={log.id} className="text-sm">
                    <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {log.date.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-right">
                      Rp {session.ratePerSession.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white border-t-2 border-slate-100">
                  <td colSpan={2} className="px-6 py-6 text-sm font-black text-slate-900 uppercase tracking-widest">Total Gaji</td>
                  <td className="px-6 py-6 text-3xl font-black text-blue-600 text-right">
                    Rp {session.totalSalary.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Wallet className="w-6 h-6" /></div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Ini adalah slip gaji otomatis yang dihasilkan oleh sistem **SwimplashOS**. Pembayaran ditransfer ke rekening yang terdaftar.
            </p>
          </div>
          <div className="flex gap-3 no-print">
            <Button variant="outline" className="gap-2 h-12 px-6 rounded-xl border-slate-200" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print Slip
            </Button>
          </div>
        </div>
      </Card>
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .shadow-2xl { box-shadow: none !important; }
          .bg-slate-50 { background: #f8fafc !important; }
        }
      `}</style>
    </div>
  );
}
