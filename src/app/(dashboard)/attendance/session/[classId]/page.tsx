"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Timestamp, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStudentById, Student } from "@/lib/firebase/students";
import { getClasses, Class } from "@/lib/firebase/branches_classes";
import { saveAttendance, checkAttendanceExists } from "@/lib/firebase/attendance";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Badge } from "@/components/ui";
import { 
  ArrowLeft, 
  Check, 
  X, 
  RotateCcw, 
  Save, 
  Loader2, 
  User as UserIcon,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/client";

export default function AttendanceSessionPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, "hadir" | "reschedule" | "no_show">>({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [trainerRate, setTrainerRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const exists = await checkAttendanceExists(classId, new Date());
        if (exists) {
          setAlreadySubmitted(true);
        }

        const classes = await getClasses();
        const foundClass = classes.find(c => c.id === classId);
        
        if (foundClass) {
          setClassInfo(foundClass);
          
          // Fetch trainer rate
          const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "swimplash";
          const trainerDoc = await getDoc(doc(db, "tenants", tenantId, "trainers", foundClass.trainerId));
          if (trainerDoc.exists()) {
            setTrainerRate(trainerDoc.data().ratePerSession || 0);
          }

          // Fetch all students in this class
          const studentsRef = collection(db, "tenants", tenantId, "students");
          const q = query(studentsRef, where("classId", "==", classId));
          const studentSnap = await getDocs(q);
          const validStudents = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
          
          setStudents(validStudents);
          const initialRecords: Record<string, "hadir" | "reschedule" | "no_show"> = {};
          validStudents.forEach(s => initialRecords[s.id!] = "hadir");
          setRecords(initialRecords);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const handleSave = async () => {
    if (!classInfo || !user) return;
    setSaving(true);
    try {
      const sessionRecords = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      await saveAttendance({
        date: Timestamp.now(),
        classId,
        branchId: classInfo.branchId,
        trainerId: classInfo.trainerId,
        sessionRecords,
        createdBy: user.uid
      }, trainerRate);
      router.push("/attendance");
    } catch (error: any) {
      alert(error.message || "Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading session...</div>;
  if (alreadySubmitted) return <div className="p-12 text-center">Absensi sudah diisi hari ini.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/attendance"><Button variant="ghost"><ArrowLeft /></Button></Link>
        <h1 className="text-2xl font-bold">{classInfo?.name}</h1>
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <Card key={student.id} className="p-4 flex items-center justify-between">
            <div><h3 className="font-bold">{student.name}</h3></div>
            <div className="flex gap-2">
              <button onClick={() => setRecords({...records, [student.id!]: "hadir"})} className={`px-4 py-2 rounded-xl text-sm font-bold ${records[student.id!] === "hadir" ? "bg-emerald-500 text-white" : "bg-slate-100"}`}>Hadir</button>
              <button onClick={() => setRecords({...records, [student.id!]: "reschedule"})} className={`px-4 py-2 rounded-xl text-sm font-bold ${records[student.id!] === "reschedule" ? "bg-amber-500 text-white" : "bg-slate-100"}`}>Reschedule</button>
              <button onClick={() => setRecords({...records, [student.id!]: "no_show"})} className={`px-4 py-2 rounded-xl text-sm font-bold ${records[student.id!] === "no_show" ? "bg-rose-500 text-white" : "bg-slate-100"}`}>No Show</button>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Simpan Absensi"}</Button>
    </div>
  );
}
