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

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Class {
  id: string;
  name: string;
  branchId: string;
  trainerId: string;
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  maxCapacity: number;
  studentIds: string[];
  isActive: boolean;
}

export const getBranches = async () => {
  const branchesRef = collection(db, "tenants", TENANT_ID, "branches");
  const q = query(branchesRef, where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
};

export const getClasses = async (branchId?: string) => {
  const classesRef = collection(db, "tenants", TENANT_ID, "classes");
  let q = query(classesRef, where("isActive", "==", true));
  
  if (branchId) {
    q = query(classesRef, where("branchId", "==", branchId), where("isActive", "==", true));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
};

export const createClass = async (classData: Omit<Class, "id">) => {
  const classesRef = collection(db, "tenants", TENANT_ID, "classes");
  const docRef = await addDoc(classesRef, {
    ...classData,
    studentIds: classData.studentIds || []
  });
  return docRef.id;
};

export const createBranch = async (branchData: Omit<Branch, "id">) => {
  const branchesRef = collection(db, "tenants", TENANT_ID, "branches");
  const docRef = await addDoc(branchesRef, {
    ...branchData,
    isActive: true
  });
  return docRef.id;
};
