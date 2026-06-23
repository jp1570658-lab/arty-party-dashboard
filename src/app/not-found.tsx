import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple-light text-brand-purple">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold text-ink-primary">Page not found</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        That page doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
