import { type VariantProps, tv } from "tailwind-variants";

// eslint-disable-next-line react-refresh/only-export-components
export const skeletonVariants = tv({
  base: "animate-pulse bg-gray-300 rounded",
  variants: {
    size: {
      sm: "h-4 w-16",
      md: "h-6 w-32",
      lg: "h-10 w-64",
      full: "h-full w-full",
    },
    shape: {
      square: "rounded",
      rounded: "rounded-lg",
      circle: "rounded-full",
    },
  },
  defaultVariants: {
    size: "md",
    shape: "rounded",
  },
});

interface SkeletonProps
  extends VariantProps<typeof skeletonVariants>,
          React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ ...props }: SkeletonProps) {
  return <div className={skeletonVariants(props)} {...props} />;
}
