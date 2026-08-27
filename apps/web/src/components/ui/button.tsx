import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--brand)] text-white shadow-[var(--shadow-control)] hover:bg-[var(--brand-hover)]",
        secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-control)] hover:border-[var(--border-strong)] hover:bg-[var(--muted-surface)]",
        ghost: "text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--foreground)]",
        danger: "bg-[var(--danger)] text-white shadow-[var(--shadow-control)] hover:bg-[var(--danger-hover)]",
        link: "h-auto px-0 text-[var(--brand)] underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "size-10 px-0",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
