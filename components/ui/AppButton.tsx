import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes } from "react";

const toneClasses = {
  primary:
    "bg-[#FDCC00] text-[#003F60] hover:bg-[#FDCC00] hover:tracking-[0.3px] focus-visible:ring-yellow-400",
  outline:
    "bg-transparent border-2 border-[#003F60] text-[#003F60] hover:bg-[#003F60] hover:text-white focus-visible:ring-[#003F60]",
  ghost:
    "bg-transparent text-[#003F60] hover:bg-[#003F60]/10 focus-visible:ring-[#003F60]",
} as const;

type Tone = keyof typeof toneClasses;

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  as?: "button" | "a";
  href?: string;
}

export function AppButton({
  tone = "primary",
  className,
  children,
  as: Tag = "button",
  href,
  ...props
}: AppButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-[30px] font-['Sora',Helvetica,Arial,sans-serif] font-bold text-[18px] pl-[36px] pr-[48px] py-[14px] leading-[1.7] transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer",
    toneClasses[tone],
    className
  );

  if (Tag === "a") {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
