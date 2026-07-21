import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 min-h-11 min-w-11 shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--pirate-red)] text-white hover:bg-[#a02e33]",
        secondary: "bg-[var(--ocean-blue)] text-white hover:bg-[#455da0]",
        outline: "border border-[var(--glass-border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--glass)]",
        ghost: "text-[var(--treasure-gold)] hover:bg-[var(--glass)]",
        gold: "bg-[var(--treasure-gold)] text-[var(--text-on-gold)] hover:bg-[#c9a85e]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3 py-2 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
