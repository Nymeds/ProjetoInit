import { tv, type VariantProps } from "tailwind-variants";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = tv({
  base: "px-4 py-2 rounded font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
  variants: {
    variant: {
      primary: "bg-accent-brand text-white hover:bg-accent-brand-light",
      secondary: "bg-background-secondary text-white hover:bg-background-tertiary",
      danger: "bg-background-danger text-white hover:bg-accent-red",
      ghost:
        "bg-transparent text-accent-paragraph hover:bg-white/5 hover:text-accent-brand border border-transparent hover:border-border-active",
    },
    size: {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
