"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Calendar, CheckSquare, LogOut, Menu, Waves, UserRound, Wallet, Settings } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Data Murid", href: "/students", icon: Users },
  { name: "Jadwal Kelas", href: "/classes", icon: Calendar },
  { name: "Absensi", href: "/attendance", icon: CheckSquare },
  { name: "Pelatih", href: "/trainers", icon: UserRound },
  { name: "Keuangan", href: "/finance", icon: Wallet },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform lg:relative lg:translate-x-0 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center gap-2 font-black text-xl text-blue-600 font-outfit tracking-tighter italic">
          <Waves /> SwimplashOS
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium ${pathname === item.href ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
              <item.icon className="w-5 h-5" /> {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 w-full px-4">
          <Button variant="ghost" className="w-full justify-start text-red-600" onClick={() => signOut(auth)}>
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center px-8 lg:hidden">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu /></Button>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
