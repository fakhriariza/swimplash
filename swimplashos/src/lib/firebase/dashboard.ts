import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  limit 
} from "firebase/firestore";
import { db } from "./client";

const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();

export const getDashboardStats = async (branchId?: string) => {
  const tenantPath = `tenants/${TENANT_ID}`;
  
  // 1. Get total students
  const studentsRef = collection(db, tenantPath, "students");
  const sSnapshot = await getDocs(studentsRef);
  const totalStudents = sSnapshot.size;

  // 2. Get today's attendance sessions
  const now = new Date();
  const startOfDay = new Date(now.setHours(0,0,0,0));
  const endOfDay = new Date(now.setHours(23,59,59,999));
  
  const attendanceRef = collection(db, tenantPath, "attendance");
  const aQuery = query(
    attendanceRef,
    where("date", ">=", Timestamp.fromDate(startOfDay)),
    where("date", "<=", Timestamp.fromDate(endOfDay))
  );
  const aSnapshot = await getDocs(aQuery);
  const sessionsToday = aSnapshot.size;

  // 3. Get monthly finance
  const financeRef = collection(db, tenantPath, "finance");
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  // Note: For real aggregation we'd use a cloud function or more specific queries
  // For MVP we fetch and filter locally or use approximate numbers
  const fSnapshot = await getDocs(financeRef);
  const transactions = fSnapshot.docs.map(doc => doc.data());
  
  const monthlyRevenue = transactions
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  return {
    totalStudents,
    sessionsToday,
    monthlyRevenue,
    activeAlerts: 0 // Placeholder
  };
};

export const getAnalyticsData = async () => {
  const tenantPath = `tenants/${TENANT_ID}`;
  const financeRef = collection(db, tenantPath, "finance");
  const fSnapshot = await getDocs(query(financeRef, orderBy("date", "asc")));
  
  const transactions = fSnapshot.docs.map(doc => ({
    ...doc.data(),
    month: (doc.data() as any).date.toDate().toLocaleString('default', { month: 'short' })
  }));

  // Aggregate by month
  const monthlyData: Record<string, any> = {};
  transactions.forEach((t: any) => {
    if (!monthlyData[t.month]) {
      monthlyData[t.month] = { name: t.month, income: 0, expense: 0 };
    }
    if (t.type === "income") monthlyData[t.month].income += t.amount;
    else monthlyData[t.month].expense += t.amount;
  });

  return Object.values(monthlyData);
};
