import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const luminaButton = cva(
  "relative inline-flex items-center justify-center gap-2 font-medium tracking-tight whitespace-nowrap " +
  "transition-all duration-300 ease-fluid select-none ring-glow disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "text-primary-foreground bg-button-lumina shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55),inset_0_1px_0_hsl(220_20%_100%/0.18)] " +
          "hover:shadow-[0_6px_28px_-6px_hsl(255_90%_65%/0.75),inset_0_1px_0_hsl(220_20%_100%/0.22)] hover:brightness-[1.06]",
        ghost:
          "text-foreground/85 bg-surface-1 border border-border " +
          "hover:bg-surface-2 hover:text-foreground hover:border-white/15",
        outline:
          "text-foreground border border-white/15 bg-transparent " +
          "hover:bg-white/[0.04] hover:border-white/25",
        glow:
          "text-foreground bg-surface-2 border border-border " +
          "hover:bg-surface-3 hover:border-white/15",
        subtle:
          "text-muted-foreground hover:text-foreground hover:bg-surface-1",
      },
      size: {
        sm: "h-8 px-3.5 text-[12px] rounded-lg",
        md: "h-9 px-4 text-[13px] rounded-lg",
        lg: "h-11 px-6 text-[14px] rounded-xl",
        icon: "h-9 w-9 rounded-lg",
        pill: "h-9 px-4 text-[13px] rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface LuminaButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof luminaButton> {}

export const LuminaButton = forwardRef<HTMLButtonElement, LuminaButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(luminaButton({ variant, size }), className)} {...props}>
        {children}
      </button>
    );
  }
);
LuminaButton.displayName = "LuminaButton";
