"use client";

import { useEffect, useState, use } from "react";
import { Timestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getStudentById, Student } from "@/lib/firebase/students";
import { getInvoicesByStudent, markInvoiceAsPaid, Invoice, createInvoice } from "@/lib/firebase/invoices";
import { getPackages, Package } from "@/lib/firebase/packages";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Badge, Modal, Select } from "@/components/ui";
import { ArrowLeft, User as UserIcon, Wallet, Printer, MessageCircle, CheckCircle2, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [processing, setProcessing] = useState<string | null>(null);
  const [showDaftar, setShowDaftar] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [savingPackage, setSavingPackage] = useState(false);

  const fetchData = async () => {
    const [sData, iData, pData] = await Promise.all([
      getStudentById(id),
      getInvoicesByStudent(id),
      getPackages()
    ]);
    setStudent(sData);
    setInvoices(iData);
    setPackages(pData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRegisterSession = async () => {
    if (!selectedPackage || !student) return;
    setSavingPackage(true);
    try {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (!pkg) throw new Error("Paket tidak ditemukan");

      // 1. Create Invoice
      await createInvoice({
        studentId: id,
        studentName: student.name,
        packageName: pkg.name,
        amount: pkg.price,
        status: "unpaid",
        date: Timestamp.now(),
        branchId: student.branchId
      });

      // 2. Update Student Active Package (reset count if new registration)
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const studentRef = doc(db, "tenants", (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim(), "students", id);
      await updateDoc(studentRef, {
        activePackage: {
          packageId: pkg.id,
          totalSessions: pkg.totalSessions,
          usedSessions: 0,
          startDate: Timestamp.fromDate(startDate),
          expiryDate: Timestamp.fromDate(expiryDate),
          status: "active"
        }
      });

      await fetchData();
      setShowDaftar(false);
      setSelectedPackage("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSavingPackage(false);
    }
  };

  const handlePay = async (invoice: Invoice) => {
    if (!invoice.id) return;
    setProcessing(invoice.id);
    try {
      await markInvoiceAsPaid(invoice.id, student?.branchId || "");
      await fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  const shareWA = (invoice: Invoice) => {
    const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
    const msg = `Halo *${student?.parentName}*, berikut adalah tagihan paket renang untuk *${student?.name}*:\n\n` +
      `No. Invoice: ${invoice.invoiceNumber}\n` +
      `Paket: ${invoice.packageName}\n` +
      `Total: *Rp ${invoice.amount.toLocaleString('id-ID')}*\n` +
      `Status: *${invoice.status.toUpperCase()}*\n\n` +
      `Link Invoice: ${invoiceUrl}\n\n` +
      `Silakan lakukan pembayaran. Terima kasih! 🏊‍♂️`;
    window.open(`https://wa.me/${student?.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading student profile...</div>;
  if (!student) return <div className="p-12 text-center text-rose-500">Student not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/students"><Button variant="ghost"><ArrowLeft /></Button></Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 text-center space-y-6 border-none shadow-sm">
            <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mx-auto shadow-inner">
              <UserIcon className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{student.name}</h1>
              <p className="text-slate-500 font-bold mt-1 text-sm">Ortu: {student.parentName}</p>
              <p className="text-slate-400 text-xs font-medium mt-1">{student.phone}</p>
            </div>
            
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Sisa Sesi Paket</p>
              <div className="flex justify-center items-center gap-2">
                <span className="text-4xl font-black text-blue-600">{student.activePackage.totalSessions - student.activePackage.usedSessions}</span>
                <span className="text-blue-400 font-bold">/ {student.activePackage.totalSessions}</span>
              </div>
              <Badge variant={student.activePackage.status === "active" ? "success" : "warning"} className="mt-4">
                {student.activePackage.status}
              </Badge>
            </div>

            <Button className="w-full gap-2 h-12 rounded-2xl bg-slate-900" onClick={() => setShowDaftar(true)}>
              <PlusCircle className="w-5 h-5" /> Daftarkan Sesi
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="text-blue-600 w-6 h-6" /> Riwayat Pembayaran
            </h2>
          </div>

          <div className="space-y-4">
            {invoices.map((inv) => (
              <Card key={inv.id} className="p-6 border-none shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">{inv.invoiceNumber}</span>
                      <Badge variant={inv.status === "paid" ? "success" : "warning"} size="xs">{inv.status.toUpperCase()}</Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{inv.packageName}</h3>
                    <p className="text-sm font-bold text-blue-600">Rp {inv.amount.toLocaleString('id-ID')}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 h-10 px-4"
                      onClick={() => shareWA(inv)}
                    >
                      <MessageCircle className="w-4 h-4" /> Link WA
                    </Button>
                    
                    {inv.status === "unpaid" ? (
                      <Button 
                        size="sm" 
                        className="gap-2 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                        onClick={() => handlePay(inv)}
                        disabled={processing === inv.id}
                      >
                        {processing === inv.id ? "..." : <CheckCircle2 className="w-4 h-4" />}
                        Tandai Lunas
                      </Button>
                    ) : (
                      <Link href={`/invoice/${inv.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="gap-2 h-10 px-4 border-slate-200">
                          <Printer className="w-4 h-4" /> Kwitansi
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {invoices.length === 0 && (
              <Card className="p-12 text-center border-dashed border-2 bg-transparent">
                <p className="text-slate-400 italic">Belum ada invoice untuk murid ini. Klik "Daftarkan Sesi" untuk memulai.</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Daftarkan Sesi Modal */}
      <Modal isOpen={showDaftar} onClose={() => setShowDaftar(false)} title="Daftarkan Sesi Baru">
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Pilih Paket Kursus</label>
            <Select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)}>
              <option value="">Pilih Paket...</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} - Rp {p.price.toLocaleString('id-ID')}</option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl italic">
            Mendaftarkan sesi baru akan otomatis membuat invoice baru dan mereset jumlah sesi aktif murid ini sesuai paket yang dipilih.
          </p>
          <Button 
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
            disabled={!selectedPackage || savingPackage}
            onClick={handleRegisterSession}
          >
            {savingPackage ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buat Tagihan Sesi"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
