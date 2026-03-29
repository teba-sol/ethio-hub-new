"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export function PrivateRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [allowedRoles, isAuthenticated, redirectTo, router, user]);

  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}

export function DashboardRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return; // Don't do anything while loading

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case UserRole.ADMIN: {
        router.replace("/dashboard/admin/overview");
        return;
      }
      case UserRole.ARTISAN: {
        if (
          user.artisanStatus === "Not Submitted" ||
          user.artisanStatus === "Pending" ||
          user.artisanStatus === "Under Review" ||
          user.artisanStatus === "Rejected" ||
          user.artisanStatus === "Modification Requested"
        ) {
          router.replace("/dashboard/artisan/onboarding");
          return;
        }
        router.replace("/dashboard/artisan/overview");
        return;
      }
      case UserRole.ORGANIZER: {
        if (
          user.organizerStatus === "Not Submitted" ||
          user.organizerStatus === "Pending" ||
          user.organizerStatus === "Under Review" ||
          user.organizerStatus === "Rejected" ||
          user.organizerStatus === "Modification Requested"
        ) {
          router.replace("/dashboard/organizer/onboarding");
          return;
        }
        router.replace("/dashboard/organizer/overview");
        return;
      }
      case UserRole.TOURIST: {
        router.replace("/dashboard/tourist/orders");
        return;
      }
      default: {
        router.replace("/");
      }
    }
  }, [isAuthenticated, router, user, loading]);

  return null;
}