"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui";
import { MapPin, Box, Bell, Shield } from "lucide-react";

const subNav = [
  { name: "Cabang", href: "/settings/branches", icon: MapPin },
  { name: "Paket Kursus", href: "/settings/packages", icon: Box },
  { name: "Notifikasi", href: "/settings/notifications", icon: Bell },
  { name: "Keamanan", href: "/settings/security", icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pengaturan</h1>
        <p className="text-slate-500 mt-1">Konfigurasi sistem, cabang, dan paket kursus Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-2">
          {subNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                  ${isActive 
                    ? "bg-white text-blue-600 shadow-sm border border-slate-100" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </aside>

        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
