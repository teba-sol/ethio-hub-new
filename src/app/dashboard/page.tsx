"use client";

import { DashboardRedirect, PrivateRoute } from "@/components/RouteGuards";

export default function Page() {
  return (
    <PrivateRoute>
      <DashboardRedirect />
    </PrivateRoute>
  );
}

