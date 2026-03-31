import { cn } from "@/lib/cn";

interface AppSectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function AppSectionLabel({ children, className }: AppSectionLabelProps) {
  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-[0.2em] text-[#FDCC00]",
        className
      )}
    >
      {children}
    </p>
  );
}
