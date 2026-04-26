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

export interface Trainer {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  ratePerSession: number;
  isActive: boolean;
}

export const getTrainers = async (branchId?: string) => {
  const trainersRef = collection(db, "tenants", TENANT_ID, "trainers");
  let q = query(trainersRef, where("isActive", "==", true));
  
  if (branchId) {
    q = query(trainersRef, where("branchId", "==", branchId), where("isActive", "==", true));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trainer));
};

export const createTrainer = async (trainerData: Omit<Trainer, "id">) => {
  const trainersRef = collection(db, "tenants", TENANT_ID, "trainers");
  return await addDoc(trainersRef, {
    ...trainerData,
    isActive: true
  });
};

export const getTrainerSessions = async (trainerId: string, month: string) => {
  const sessionsRef = collection(db, "tenants", TENANT_ID, "trainer_sessions");
  const q = query(
    sessionsRef, 
    where("trainerId", "==", trainerId),
    where("month", "==", month)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
