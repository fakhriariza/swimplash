import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  Timestamp, 
  orderBy 
} from "firebase/firestore";
import { db } from "./client";

const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  packageName: string;
  amount: number;
  status: "unpaid" | "paid";
  date: Timestamp;
  branchId: string;
  paidAt?: Timestamp;
  createdAt: Timestamp;
}

export const createInvoice = async (data: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) => {
  const invoicesRef = collection(db, "tenants", TENANT_ID, "invoices");
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  
  return await addDoc(invoicesRef, {
    ...data,
    invoiceNumber,
    createdAt: Timestamp.now()
  });
};

export const getInvoicesByStudent = async (studentId: string) => {
  const invoicesRef = collection(db, "tenants", TENANT_ID, "invoices");
  const q = query(invoicesRef, where("studentId", "==", studentId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
};

export const markInvoiceAsPaid = async (invoiceId: string, branchId: string) => {
  const invoiceRef = doc(db, "tenants", TENANT_ID, "invoices", invoiceId);
  const invoiceSnap = await getDoc(invoiceRef);
  
  if (!invoiceSnap.exists()) throw new Error("Invoice tidak ditemukan");
  const invoiceData = invoiceSnap.data() as Invoice;

  await updateDoc(invoiceRef, {
    status: "paid",
    paidAt: Timestamp.now()
  });

  // Create Finance Record
  const financeRef = collection(db, "tenants", TENANT_ID, "finance");
  await addDoc(financeRef, {
    date: Timestamp.now(),
    type: "income",
    category: "paket_murid",
    amount: invoiceData.amount,
    branchId: branchId,
    description: `Pembayaran ${invoiceData.packageName} - ${invoiceData.studentName}`,
    referenceId: invoiceId,
    createdAt: Timestamp.now()
  });
};
