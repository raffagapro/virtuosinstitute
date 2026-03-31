import { type ReactNode } from "react";

interface AppContactInfoGroupProps {
  title: string;
  titleClassName?: string;
  className?: string;
  children: ReactNode;
}

export function AppContactInfoGroup({
  title,
  titleClassName,
  className,
  children,
}: AppContactInfoGroupProps) {
  return (
    <div className={className}>
      <p className={titleClassName}>{title}</p>
      {children}
    </div>
  );
}
