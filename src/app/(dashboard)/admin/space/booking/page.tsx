"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpaceBookingRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/admin/bookings");
  }, [router]);

  return (
    <div className="p-4 text-muted small d-flex align-items-center gap-2">
      <div className="spinner-border spinner-border-sm text-primary" role="status" />
      Redirecting to Facilities Booking...
    </div>
  );
}
