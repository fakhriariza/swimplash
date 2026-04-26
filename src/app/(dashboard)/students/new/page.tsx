"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { createStudent } from "@/lib/firebase/students";
import { getPackages, Package } from "@/lib/firebase/packages";
import { createInvoice } from "@/lib/firebase/invoices";
import { getBranches, getClasses, Branch, Class } from "@/lib/firebase/branches_classes";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input, Select } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewStudentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    parentName: "",
    phone: "",
    branchId: profile?.branchId || "",
    classId: "",
    packageId: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchData = async () => {
      const [b, p] = await Promise.all([getBranches(), getPackages()]);
      setBranches(b);
      setPackages(p);
      if (formData.branchId) {
        const c = await getClasses(formData.branchId);
        setClasses(c);
      }
    };
    fetchData();
  }, [formData.branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pkg = packages.find(p => p.id === formData.packageId);
      if (!pkg) throw new Error("Pilih paket");
      const startDate = new Date(formData.startDate);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + 30);

      const studentId = await createStudent({
        name: formData.name,
        parentName: formData.parentName,
        phone: formData.phone,
        branchId: formData.branchId,
        classId: formData.classId,
        activePackage: {
          packageId: formData.packageId,
          totalSessions: pkg.totalSessions,
          usedSessions: 0,
          startDate: Timestamp.fromDate(startDate),
          expiryDate: Timestamp.fromDate(expiryDate),
          status: "active",
        }
      });

      // Create Invoice
      await createInvoice({
        studentId,
        studentName: formData.name,
        packageName: pkg.name,
        amount: pkg.price,
        status: "unpaid",
        date: Timestamp.now(),
        branchId: formData.branchId
      });

      router.push("/students");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/students"><Button variant="ghost"><ArrowLeft /></Button></Link>
      <h1 className="text-2xl font-bold">Tambah Murid Baru</h1>
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input required placeholder="Nama Murid" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Input required placeholder="Nama Orang Tua" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
          <Input required placeholder="No. WA" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value, classId: ""})}>
            <option value="">Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} disabled={!formData.branchId}>
            <option value="">Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select required value={formData.packageId} onChange={e => setFormData({...formData, packageId: e.target.value})}>
            <option value="">Paket</option>
            {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Saving..." : "Simpan Data Murid"}</Button>
        </form>
      </Card>
    </div>
  );
}
