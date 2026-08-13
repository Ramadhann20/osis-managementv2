"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import AppNavbar from "@/components/layout/AppNavbar";
import AppSidebar from "@/components/layout/AppSidebar";

const anggotaMenu = [
  {
    label: "Dashboard",
    href: "/anggota/dashboard",
    icon: "dashboard",
  },
  {
    label: "Biodata",
    href: "/anggota/biodata",
    icon: "person",
  },
  {
    label: "Absensi",
    href: "/anggota/absensi",
    icon: "fact_check",
  },
  {
    label: "Kegiatan",
    href: "/anggota/kegiatan",
    icon: "event_available",
  },
  {
    label: "Pengumuman",
    href: "/anggota/pengumuman",
    icon: "campaign",
  },
];

function getInitials(name) {
  return String(name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getActivePageTitle(pathname) {
  const activeMenu = anggotaMenu.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
  );

  return activeMenu?.label || "Anggota";
}

export default function AnggotaLayout({ children }) {
  const pathname = usePathname();
  const { user, userDoc } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const profile = useMemo(() => {
    const name =
      userDoc?.fullName ||
      userDoc?.username ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Anggota";

    return {
      name,
      initials: getInitials(name),
      roleLabel: "Anggota",
    };
  }, [user, userDoc]);

  const pageTitle = getActivePageTitle(pathname);

  return (
    <div className="min-h-screen bg-surface text-text">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={anggotaMenu}
        profile={profile}
      />

      <AppNavbar
        pageTitle={pageTitle}
        searchPlaceholder={`Cari di ${pageTitle.toLowerCase()}...`}
        profile={profile}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <main className="min-h-screen pt-16 lg:ml-[260px]">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}