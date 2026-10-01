import { Link } from "react-router-dom";
import { DollarSign, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-brand-gradient text-white shadow-lg mb-6">
          <DollarSign className="size-8" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go to home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/track">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Track a transfer
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
