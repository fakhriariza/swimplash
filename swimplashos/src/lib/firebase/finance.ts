import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "./client";

const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();

export interface Transaction {
  id?: string;
  date: Timestamp;
  type: "income" | "expense";
  category: "paket_murid" | "gaji_pelatih" | "operasional" | "lainnya";
  amount: number;
  branchId: string;
  description: string;
  createdBy: string;
  referenceId?: string;
  createdAt: Timestamp;
}

export const getTransactions = async (branchId?: string) => {
  const financeRef = collection(db, "tenants", TENANT_ID, "finance");
  let q = query(financeRef, orderBy("date", "desc"));
  
  if (branchId) {
    q = query(financeRef, where("branchId", "==", branchId), orderBy("date", "desc"));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const createTransaction = async (data: Omit<Transaction, "id" | "createdAt">) => {
  const financeRef = collection(db, "tenants", TENANT_ID, "finance");
  return await addDoc(financeRef, {
    ...data,
    createdAt: Timestamp.now()
  });
};
