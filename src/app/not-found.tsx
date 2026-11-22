import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-slate-900 p-4 border border-slate-800 mb-4">
        <Icons.AtlasOrb className="h-12 w-12 text-slate-400" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
        404 &mdash; Resource Not Found
      </h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The requested AI model, benchmark, or registry endpoint could not be found.
      </p>
      <Link href="/">
        <Button variant="primary" size="md">
          Return to Model Discovery
        </Button>
      </Link>
    </div>
  );
}
