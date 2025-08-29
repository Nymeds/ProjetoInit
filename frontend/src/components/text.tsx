import React, { type JSX } from "react";

type Variant =
  | "heading-large"
  | "heading-medium"
  | "heading-small"
  | "paragraph-medium"
  | "paragraph-small"
  | "label-small";

type TextProps = React.HTMLAttributes<HTMLElement> & {
  variant?: Variant;
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
};

const variantTagMap: Record<Variant, keyof JSX.IntrinsicElements> = {
  "heading-large": "h1",
  "heading-medium": "h2",
  "heading-small": "h3",
  "paragraph-medium": "p",
  "paragraph-small": "p",
  "label-small": "span",
};

const variantClassMap: Record<Variant, string> = {
  "heading-large": "text-2xl font-semibold",
  "heading-medium": "text-xl font-semibold",
  "heading-small": "text-lg font-semibold",
  "paragraph-medium": "text-base",
  "paragraph-small": "text-sm",
  "label-small": "text-xs uppercase tracking-wide",
};

export function Text({
  variant = "paragraph-medium",
  as,
  children,
  className = "",
  ...props
}: TextProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = (as || variantTagMap[variant] || "span") as any;
  const classes = `${variantClassMap[variant] || ""} ${className}`.trim();

  return (
    <Tag className={classes || undefined} {...props}>
      {children}
    </Tag>
  );
}