"use client";
import { TouristLayout } from '@/components/layouts/TouristLayout';
import { PrivateRoute } from "@/components/RouteGuards";
import { UserRole } from "@/types";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute allowedRoles={[UserRole.TOURIST]}>
      <TouristLayout>{children}</TouristLayout>
    </PrivateRoute>
  );
}
