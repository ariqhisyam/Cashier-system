"use client";
import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks";

export default function KaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthorized } = useRequireAuth(["KARYAWAN"]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent SSR hydration mismatch and guard unauthorized access
  if (!isMounted || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
