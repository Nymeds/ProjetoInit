import { type VariantProps, tv } from "tailwind-variants";

// eslint-disable-next-line react-refresh/only-export-components
export const containerVariants = tv({
  base: "mx-auto px-4 w-full",
  variants: {
    size: {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-7xl",
    },
    padding: {
      none: "",
      sm: "py-2",
      md: "py-4",
      lg: "py-6",
    },
  },
  defaultVariants: {
    size: "lg",
    padding: "md",
  },
});

interface ContainerProps
  extends VariantProps<typeof containerVariants>,
          React.HTMLAttributes<HTMLDivElement> {}

export function Container({ children, ...props }: ContainerProps) {
  return <div className={containerVariants(props)} {...props}>{children}</div>;
}
