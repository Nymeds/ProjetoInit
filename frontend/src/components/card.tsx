import { type VariantProps, tv } from "tailwind-variants";
import React from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const cardVariants = tv({
  base: "rounded transition shadow",
  variants: {
    variant: {
      default: "bg-card-bg border border-gray-200",
      primary: "bg-primary text-white",
    },
    size: {
      none: "",
      md: "p-3",
      lg: "p-6",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

interface CardProps
  extends VariantProps<typeof cardVariants>,
          React.ComponentProps<"div"> {
  as?: keyof React.JSX.IntrinsicElements;
}

export default function Card({ as = "div", size, variant, children, className, ...props }: CardProps) {
  return React.createElement(
    as,
    { className: cardVariants({ size, variant, className }), ...props },
    children
  );
}
