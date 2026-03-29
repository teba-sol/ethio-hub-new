"use client";
import { ArtisanLayout } from '@/components/layouts/ArtisanLayout';
import { PrivateRoute } from "@/components/RouteGuards";
import { UserRole } from "@/types";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute allowedRoles={[UserRole.ARTISAN]}>
      <ArtisanLayout>{children}</ArtisanLayout>
    </PrivateRoute>
  );
}
