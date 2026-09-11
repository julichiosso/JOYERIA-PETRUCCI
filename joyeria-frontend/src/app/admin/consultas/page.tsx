"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminConsultasRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/metricas?tab=consultas");
  }, [router]);

  return (
    <div className="py-20 flex justify-center">
      <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
