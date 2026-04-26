import { Timestamp } from "firebase/firestore";

export interface StudentPackage {
  totalSessions: number;
  usedSessions: number;
  startDate: Timestamp;
  expiryDate: Timestamp;
  status: "active" | "almost_done" | "done" | "expired";
}

export function calculatePackageStatus(pkg: StudentPackage): "active" | "almost_done" | "done" | "expired" {
  const today = new Date();
  const expiry = pkg.expiryDate.toDate();
  const remaining = pkg.totalSessions - pkg.usedSessions;

  if (today > expiry) return "expired";
  if (remaining <= 0) return "done";
  if (remaining <= 2) return "almost_done";
  return "active";
}
