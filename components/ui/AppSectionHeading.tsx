import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AppSectionLabel } from "./AppSectionLabel";

interface AppSectionHeadingProps {
  label?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  labelClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function AppSectionHeading({
  label,
  title,
  subtitle,
  className,
  labelClassName,
  titleClassName,
  subtitleClassName,
}: AppSectionHeadingProps) {
  return (
    <div className={cn("flex flex-col items-center text-center gap-3", className)}>
      {label ? <AppSectionLabel className={labelClassName}>{label}</AppSectionLabel> : null}
      <h2
        className={cn(
          "font-['Sora',Helvetica,Arial,sans-serif] font-bold text-3xl md:text-4xl",
          titleClassName
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "font-['Sora',Helvetica,Arial,sans-serif] text-[17px] leading-[1.6em]",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}