"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CircularProgress } from "@mui/material";

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => session?.user?.roles?.includes(role));
      if (!hasRole) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router, requiredRoles]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F9FBFD]">
        <CircularProgress />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => session?.user?.roles?.includes(role));
    if (!hasRole) {
      return null;
    }
  }

  return <>{children}</>;
}
