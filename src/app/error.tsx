"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error("OneAtlas App Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-rose-950/50 p-4 border border-rose-800/40 mb-4 text-rose-400 font-mono text-xl">
        !
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        An unexpected error occurred while rendering the intelligence platform.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" size="md" onClick={() => reset()}>
          Try Again
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => router.push("/")}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}
