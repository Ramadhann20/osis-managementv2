"use client";

import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

/**
 * Mengambil dokumen Anggota milik akun yang sedang login.
 *
 * Aturan relasi terbaru:
 * - Users document.id = Firebase Auth UID.
 * - Anggota document.id = Firestore Auto ID.
 * - Anggota.idPengguna = Users document.id.
 *
 * Tidak ada lagi pencarian melalui uid/userId/email di dokumen Anggota.
 */
export function useCurrentMember() {
  const { user, accessLoading } = useAuth();
  const { colRef, query, where, limit } = useDb();

  const anggotaSaya = useCollection(
    () =>
      user?.uid
        ? query(
            colRef("Anggota"),
            where("idPengguna", "==", user.uid),
            limit(2)
          )
        : null,
    [user?.uid],
    { enabled: Boolean(user?.uid) }
  );

  const rows = Array.isArray(anggotaSaya.rows) ? anggotaSaya.rows : [];
  const member = rows[0] || null;

  const duplicateError = useMemo(() => {
    if (rows.length <= 1) return null;

    return new Error(
      "Terdapat lebih dari satu dokumen Anggota yang terhubung ke akun ini. Hubungi pembina untuk memperbaiki relasi idPengguna."
    );
  }, [rows.length]);

  return {
    member,
    memberId: member?.id || null,
    loading: accessLoading || anggotaSaya.loading,
    error: anggotaSaya.error || duplicateError,
  };
}

export default useCurrentMember;
