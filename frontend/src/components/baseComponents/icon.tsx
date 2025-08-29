import React, { type JSX } from "react";
import { type VariantProps, tv } from "tailwind-variants";

// eslint-disable-next-line react-refresh/only-export-components
export const iconVariants = tv({
    base: "inline-block",
    variants: {
      size: { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" },
      iconColor: {
        dark: "text-text-dark",
        light: "text-text-light",
        primary: "text-primary",
        secondary: "text-secondary",
        danger: "text-danger",
        success: "text-success",
      },
    },
    defaultVariants: { size: "md", iconColor: "dark" },
  });
  

interface IconProps
  extends VariantProps<typeof iconVariants>,
          React.HTMLAttributes<HTMLSpanElement> {
  svg: JSX.Element;
}

export function Icon({ svg, ...props }: IconProps) {
  return <span className={iconVariants(props)}>{svg}</span>;
}
