import {tv} from "tailwind-variants";
import React from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const cardVariants = tv({
    base: `
        rounded transition
    `,
    variants: {
        variant: {
            default: "border border-solid border-border-primary bg-transparent",
            primary: "bg-background-primary",
      secundary: "bg-background-secundary",
        },
        size: {
            none: "",
            md: "p-3",
            lg: "p-6",
        },
    },
    defaultVariants: {
        size: "none",
        variant: "default",
    },
});

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  
  bodyClassName?: string;
  sName?: string;
  floating?: boolean;
};

export default function Card({
  header,
  footer,
  children,
  bodyClassName = '',
  floating = false,
  className = '',
  ...props
}: CardProps) {
  const isClickable = typeof props.onClick === 'function';
  const floatingClasses = floating
    ? 'backdrop-blur-sm bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] shadow-lg'
    : '';

  return (
    <div
      {...props}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          props.onClick?.(e as any);
        }
      }}
      className={`
        card-surface
        ${floatingClasses}
        ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        ${className}
      `}
    >
      {header ? <div className="mb-4">{header}</div> : null}

      <div className={`min-h-[44px] ${bodyClassName}`}>
        {children}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
