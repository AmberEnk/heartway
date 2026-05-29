import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary" && "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)]",
        variant === "ghost" && "hover:bg-[var(--border)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
