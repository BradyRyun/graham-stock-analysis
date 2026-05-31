import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageWrapperProps = {
  children: ReactNode;
  className?: string;
};

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full justify-center bg-background",
        className
      )}
    >
      <main className="flex w-full max-w-6xl flex-col px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}
