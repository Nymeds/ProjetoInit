import { type VariantProps, tv } from "tailwind-variants";

// eslint-disable-next-line react-refresh/only-export-components
export const textVariants = tv({
    base: "transition-colors",
    variants: {
      size: { sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-xl" },
      textColor: {
        dark: "text-text-dark",
        light: "text-text-light",
        primary: "text-primary",
        secondary: "text-secondary",
        danger: "text-danger",
        success: "text-success",
      },
      weight: { normal: "font-normal", medium: "font-medium", bold: "font-bold" },
    },
    defaultVariants: { size: "md", textColor: "dark", weight: "normal" },
  });
  
interface TextProps
  extends VariantProps<typeof textVariants>,
          React.HTMLAttributes<HTMLParagraphElement> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Text({ children, className, ...props }: TextProps) {
  return <p className={textVariants(props)} {...props}>{children}</p>;
}
