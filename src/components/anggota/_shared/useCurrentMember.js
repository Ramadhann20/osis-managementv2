"use client";

import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";
import { useDoc } from "@/hooks/useDoc";

export function useCurrentMember() {
  const { user, accessLoading } = useAuth();
  const { colRef, query, where, limit } = useDb();

  const directDocument = useDoc("Anggota", user?.uid, {
    enabled: Boolean(user?.uid),
  });

  const byUid = useCollection(
    () =>
      query(
        colRef("Anggota"),
        where("uid", "==", user.uid),
        limit(1)
      ),
    [user?.uid],
    { enabled: Boolean(user?.uid) }
  );

  const byUserId = useCollection(
    () =>
      query(
        colRef("Anggota"),
        where("userId", "==", user.uid),
        limit(1)
      ),
    [user?.uid],
    { enabled: Boolean(user?.uid) }
  );

  const byEmail = useCollection(
    () =>
      query(
        colRef("Anggota"),
        where("email", "==", user.email),
        limit(1)
      ),
    [user?.email],
    { enabled: Boolean(user?.email) }
  );

  const member = useMemo(
    () =>
      directDocument.data ||
      byUid.data?.[0] ||
      byUserId.data?.[0] ||
      byEmail.data?.[0] ||
      null,
    [
      directDocument.data,
      byUid.data,
      byUserId.data,
      byEmail.data,
    ]
  );

  const error =
    directDocument.error ||
    byUid.error ||
    byUserId.error ||
    byEmail.error ||
    null;

  const loading =
    accessLoading ||
    directDocument.loading ||
    byUid.loading ||
    byUserId.loading ||
    byEmail.loading;

  return {
    user,
    member,
    memberId: member?.id || null,
    loading,
    error,
  };
}
