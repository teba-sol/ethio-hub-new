"use client";
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PrivateRoute } from "@/components/RouteGuards";
import { UserRole } from "@/types";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );
}
