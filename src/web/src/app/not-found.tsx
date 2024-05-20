import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-background  bg-fixed bg-cover bg-bottom error-bg">
        <div className="container">
          <div className="row">
            <div className="col-sm-8 offset-sm-2 text-gray-50 text-center -mt-52">
              <div className="relative">
                <h1 className="relative text-9xl tracking-tighter-less text-shadow font-sans font-bold">
                  <span>4</span>
                  <span>0</span>
                  <span>4</span>
                </h1>
              </div>
              <h5 className="text-white font-semibold mt-3">Page not found</h5>
              <p className="text-white mt-2 mb-6">
                We're sorry, but the page you were looking for doesn't exist in
                our source code.
              </p>
              <Link
                className={cn(
                  "text-white",
                  `${buttonVariants({ variant: "link" })}`
                )}
                href="/"
              >
                Return to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
