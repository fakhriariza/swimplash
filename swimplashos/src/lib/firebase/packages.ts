import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc
} from "firebase/firestore";
import { db } from "./client";

const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();

export interface Package {
  id: string;
  name: string;
  totalSessions: number;
  price: number;
  description?: string;
  isActive: boolean;
}

export const getPackages = async () => {
  const packagesRef = collection(db, "tenants", TENANT_ID, "packages");
  const q = query(packagesRef, where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
};

export const createPackage = async (packageData: Omit<Package, "id">) => {
  const packagesRef = collection(db, "tenants", TENANT_ID, "packages");
  return await addDoc(packagesRef, {
    ...packageData,
    isActive: true
  });
};
