"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, Badge, Button } from "@/components/ui";
import { Printer, Download, Waves, CheckCircle2 } from "lucide-react";

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "swimplash";
        const snap = await getDoc(doc(db, "tenants", tenantId, "invoices", id));
        if (snap.exists()) setInvoice({ id: snap.id, ...snap.data() });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!invoice) return <div className="p-12 text-center">Invoice not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
      <Card className="max-w-2xl w-full p-8 md:p-12 border-none shadow-2xl space-y-10 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full -mr-16 -mt-16" />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-2xl text-blue-600"><Waves className="w-8 h-8" /> SwimplashOS</div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                {invoice.status === "paid" ? "Kwitansi" : "Tagihan"}
              </h1>
              <p className="text-slate-400 font-bold text-sm tracking-widest">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <Badge variant={invoice.status === "paid" ? "success" : "warning"} className="px-4 py-1.5 text-xs">
            {invoice.status.toUpperCase()}
          </Badge>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ditujukan Untuk</p>
            <h3 className="text-xl font-bold text-slate-900">{invoice.studentName}</h3>
            <p className="text-sm text-slate-500 font-medium">Siswa Swimplash</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tanggal</p>
            <h3 className="text-xl font-bold text-slate-900">{invoice.date.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            {invoice.paidAt && <p className="text-xs text-emerald-500 font-bold mt-1 uppercase">Lunas pada {invoice.paidAt.toDate().toLocaleDateString('id-ID')}</p>}
          </div>
        </div>

        {/* Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
            <span>Deskripsi Paket</span>
            <span>Total</span>
          </div>
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-lg">{invoice.packageName}</p>
              <p className="text-xs text-slate-500">Pendaftaran & Biaya Kursus</p>
            </div>
            <p className="text-2xl font-black text-slate-900">Rp {invoice.amount.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {invoice.status === "paid" && <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>}
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {invoice.status === "paid" 
                ? "Pembayaran ini sah sebagai tanda terima pembayaran yang valid." 
                : "Harap selesaikan pembayaran sebelum jatuh tempo untuk melanjutkan sesi renang."}
            </p>
          </div>
          <div className="flex gap-3 no-print">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</Button>
            <Button className="gap-2"><Download className="w-4 h-4" /> Download PDF</Button>
          </div>
        </div>
      </Card>
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-slate-50 { background: #f8fafc !important; }
        }
      `}</style>
    </div>
  );
}
