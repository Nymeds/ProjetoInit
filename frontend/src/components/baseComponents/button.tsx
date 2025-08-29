import { type VariantProps, tv } from "tailwind-variants";
import React from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = tv({
  base: "rounded font-medium transition-colors focus:outline-none",
  variants: {
    variant: {
      primary: "bg-primary text-white hover:bg-primary-dark",
      secondary: "bg-secondary text-white hover:bg-blue-400",
      danger: "bg-danger text-white hover:bg-red-600",
    },
    size: {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
          React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({ children, variant, size, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size })} {...props}>
      {children}
    </button>
  );
}
