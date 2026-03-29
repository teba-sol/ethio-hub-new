"use client";
import { OrganizerLayout } from '@/components/layouts/OrganizerLayout';
import { PrivateRoute } from "@/components/RouteGuards";
import { UserRole } from "@/types";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute allowedRoles={[UserRole.ORGANIZER]}>
      <OrganizerLayout>{children}</OrganizerLayout>
    </PrivateRoute>
  );
}
