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
  const { isAuthenticated, user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, allowedRoles, redirectTo, router, user]);

  if (loading) return null;
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
        if (user.artisanStatus === 'Not Submitted') {
          router.replace('/dashboard/artisan/onboarding');
          return;
        }
        if (
          user.artisanStatus === 'Pending' ||
          user.artisanStatus === 'Under Review' ||
          user.artisanStatus === 'Rejected' ||
          user.artisanStatus === 'Modification Requested'
        ) {
          router.replace('/artisan/waiting');
          return;
        }
        router.replace('/dashboard/artisan/overview');
        return;
      }
      case UserRole.ORGANIZER: {
        if (user.organizerStatus === 'Not Submitted') {
          router.replace('/dashboard/organizer/onboarding');
          return;
        }
        if (
          user.organizerStatus === 'Pending' ||
          user.organizerStatus === 'Under Review' ||
          user.organizerStatus === 'Rejected' ||
          user.organizerStatus === 'Modification Requested'
        ) {
          router.replace('/organizer/waiting');
          return;
        }
        router.replace('/dashboard/organizer/overview');
        return;
      }
      case UserRole.TOURIST: {
        router.replace("/dashboard/tourist/orders");
        return;
      }
      case UserRole.DELIVERY: {
        if (!user.deliveryStatus || user.deliveryStatus === 'Not Submitted') {
          router.replace('/dashboard/delivery/onboarding');
          return;
        }
        if (user.deliveryStatus === 'Rejected' || user.deliveryStatus === 'Modification Requested') {
          router.replace('/dashboard/delivery/onboarding');
          return;
        }
        if (
          user.deliveryStatus === 'Pending' ||
          user.deliveryStatus === 'Under Review'
        ) {
          router.replace('/delivery/waiting');
          return;
        }
        router.replace("/dashboard/delivery");
        return;
      }
      default: {
        router.replace("/");
      }
    }
  }, [isAuthenticated, router, user, loading]);

  return null;
}