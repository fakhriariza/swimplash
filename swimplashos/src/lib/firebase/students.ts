import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  orderBy
} from "firebase/firestore";
import { db } from "./client";

const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();

export interface StudentPackage {
  packageId: string;
  totalSessions: number;
  usedSessions: number;
  startDate: Timestamp;
  expiryDate: Timestamp;
  status: "active" | "almost_done" | "done" | "expired";
}

export interface Student {
  id?: string;
  name: string;
  phone: string;
  parentName: string;
  branchId: string;
  classId: string;
  photoUrl?: string;
  createdAt: Timestamp;
  activePackage: StudentPackage;
}

export const getStudents = async (branchId?: string) => {
  const studentsRef = collection(db, "tenants", TENANT_ID, "students");
  let q = query(studentsRef, orderBy("createdAt", "desc"));
  
  if (branchId) {
    q = query(studentsRef, where("branchId", "==", branchId), orderBy("createdAt", "desc"));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

import { sendWhatsApp, templates } from "../whatsapp/fonnte";

export const createStudent = async (studentData: Omit<Student, "id" | "createdAt">) => {
  const studentsRef = collection(db, "tenants", TENANT_ID, "students");
  const docRef = await addDoc(studentsRef, {
    ...studentData,
    createdAt: Timestamp.now()
  });

  // Get package name for welcome message
  const pkgRef = doc(db, "tenants", TENANT_ID, "packages", studentData.activePackage.packageId);
  const pkgSnap = await getDoc(pkgRef);
  const packageName = pkgSnap.exists() ? pkgSnap.data().name : "Kursus Renang";

  // Send Welcome WhatsApp
  sendWhatsApp(
    studentData.phone, 
    templates.welcome(studentData.name, packageName, studentData.activePackage.totalSessions)
  );

  return docRef;
};

export const getStudentById = async (studentId: string) => {
  const studentDocRef = doc(db, "tenants", TENANT_ID, "students", studentId);
  const studentDoc = await getDoc(studentDocRef);
  if (studentDoc.exists()) {
    return { id: studentDoc.id, ...studentDoc.data() } as Student;
  }
  return null;
};
