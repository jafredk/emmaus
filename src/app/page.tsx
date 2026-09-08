import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="healthcare-bg flex min-h-screen items-center justify-center px-4">
      <main className="w-full max-w-2xl rounded-3xl border border-border bg-white p-8 shadow-[0_18px_40px_-20px_rgba(8,58,99,0.45)]">
        <p className="mb-2 inline-flex rounded-full bg-[#d9edff] px-3 py-1 text-xs font-semibold text-primary">
          Healthcare Facility Management
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Emmaus Clinic Operations Hub
        </h1>
        <p className="mt-3 text-[#446982]">
          Manage the complete patient journey from reception to consultation,
          laboratory, pharmacy, and visit completion.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/login">
            <Button size="lg">Open Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
