"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import AppSidebar from "@/components/layout/AppSidebar";
import AppNavbar from "@/components/layout/AppNavbar";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    label: "Dashboard",
    href: "/pembina/dashboard",
    icon: "dashboard",
  },
  {
    label: "Manajemen Kegiatan",
    href: "/pembina/kegiatan",
    icon: "event_available",
  },
  {
    label: "Absensi Anggota",
    href: "/pembina/absensi",
    icon: "fact_check",
  },
  {
    label: "Data Anggota",
    href: "/pembina/data-anggota",
    icon: "groups",
  },
  {
    label: "Pengumuman",
    href: "/pembina/pengumuman",
    icon: "campaign",
  },
];

function getInitials(name) {
  return String(name || "Pembina OSIS")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getPageTitle(pathname) {
  const activeItem = menuItems.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
  );

  return activeItem?.label || "Dashboard Pembina";
}

function getSearchPlaceholder(pathname) {
  if (pathname.startsWith("/pembina/data-anggota")) {
    return "Cari nama, NIS, kelas, atau jabatan...";
  }

  if (pathname.startsWith("/pembina/absensi")) {
    return "Cari anggota atau kegiatan...";
  }

  if (pathname.startsWith("/pembina/kegiatan")) {
    return "Cari kegiatan, proposal, atau laporan...";
  }

  if (pathname.startsWith("/pembina/pendaftaran")) {
    return "Cari calon anggota atau NIS...";
  }

  if (pathname.startsWith("/pembina/pengumuman")) {
    return "Cari pengumuman atau penulis...";
  }

  return "Cari data, kegiatan, atau anggota...";
}

export default function PembinaLayout({ children }) {
  const pathname = usePathname();

  const {
    user,
    userDoc,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const profile = useMemo(() => {
    const name =
      userDoc?.fullName ||
      userDoc?.name ||
      userDoc?.username ||
      user?.displayName ||
      user?.email?.split("@")?.[0] ||
      "Pembina OSIS";

    return {
      initials: getInitials(name),
      name,
      roleLabel: "Pembina OSIS",
      email:
        userDoc?.email ||
        user?.email ||
        "",
      photoURL:
        userDoc?.photoURL ||
        user?.photoURL ||
        "",
    };
  }, [user, userDoc]);

  const currentPath = pathname || "/pembina/dashboard";

  const pageTitle = getPageTitle(currentPath);

  const searchPlaceholder =
    getSearchPlaceholder(currentPath);

  function handleGlobalSearch(value) {
    const nextValue =
      typeof value === "string"
        ? value
        : value?.target?.value || "";

    setGlobalSearch(nextValue);
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={menuItems}
        profile={profile}
      />

      <AppNavbar
        onOpenSidebar={() => setSidebarOpen(true)}
        pageTitle={pageTitle}
        searchPlaceholder={searchPlaceholder}
        searchValue={globalSearch}
        onSearch={handleGlobalSearch}
        profile={profile}
      />

      <main className="min-h-screen bg-surface px-4 pb-8 pt-20 lg:ml-[260px] lg:px-8">
        <div className="mx-auto w-full max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  );
}