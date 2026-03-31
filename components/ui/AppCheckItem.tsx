import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface AppCheckItemProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  icon?: ReactNode;
}

export function AppCheckItem({
  children,
  as: Tag = "li",
  className,
  iconClassName,
  textClassName,
  icon = "✓",
}: AppCheckItemProps) {
  return (
    <Tag className={cn("flex items-start gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#37E8E2] text-[12px] leading-none text-white",
          iconClassName
        )}
      >
        {icon}
      </span>
      <span className={cn("font-['Sora',Helvetica,Arial,sans-serif] text-[15px] leading-[1.6]", textClassName)}>
        {children}
      </span>
    </Tag>
  );
}