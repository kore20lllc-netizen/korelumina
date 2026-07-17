import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const luminaButton = cva(
  [
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium tracking-tight",
    "transform-gpu",
    "will-change-transform",
    "transition-all duration-300 ease-fluid",
    "select-none active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:[--tw-ring-color:var(--lumina-accent-color)]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "text-white",
          "border",
          "[border-color:var(--lumina-border-emphasis)]",
          "[background:var(--lumina-surface-selected)]",
          "[box-shadow:var(--lumina-shadow-selected)]",
          "hover:-translate-y-[1px]",
          "hover:-translate-y-[2px]",
          "hover:scale-[1.02]",
          "hover:[box-shadow:var(--lumina-shadow-hover)]",
          "active:translate-y-0",
          "active:scale-[0.98]",
        ].join(" "),

        success: [
          "text-white",
          "border border-emerald-400/30",
          "bg-[linear-gradient(180deg,hsl(152_78%_48%),hsl(158_72%_33%))]",
          "shadow-[0_10px_30px_-10px_hsl(155_85%_45%/.70),inset_0_1px_0_rgba(255,255,255,.30)]",
          "hover:-translate-y-[1px]",
          "hover:brightness-110",
        ].join(" "),

        warning: [
          "text-white",
          "border border-amber-400/30",
          "bg-[linear-gradient(180deg,hsl(42_100%_58%),hsl(34_95%_47%))]",
          "shadow-[0_10px_30px_-10px_hsl(40_100%_55%/.65),inset_0_1px_0_rgba(255,255,255,.30)]",
          "hover:-translate-y-[1px]",
          "hover:brightness-110",
        ].join(" "),

        danger: [
          "text-white",
          "border border-red-400/30",
          "bg-[linear-gradient(180deg,hsl(0_85%_60%),hsl(0_72%_48%))]",
          "shadow-[0_10px_30px_-10px_hsl(0_85%_55%/.70),inset_0_1px_0_rgba(255,255,255,.25)]",
          "hover:-translate-y-[1px]",
          "hover:brightness-110",
        ].join(" "),

        toolbar: [
          "text-white",
          "border",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-panel)]",
          "[box-shadow:var(--lumina-shadow-panel)]",
          "hover:[border-color:var(--lumina-border-emphasis)]",
          "hover:-translate-y-[2px]",
          "hover:scale-[1.02]",
          "hover:[box-shadow:var(--lumina-shadow-hover)]",
          "active:translate-y-0",
          "active:scale-[0.98]",
        ].join(" "),

        glow: [
          "text-foreground",
          "border",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-interactive)]",
          "[backdrop-filter:var(--lumina-blur-surface)]",
          "[box-shadow:var(--lumina-shadow-panel)]",
          "hover:[border-color:var(--lumina-border-emphasis)]",
          "hover:[background:var(--lumina-surface-selected)]",
          "hover:-translate-y-[2px]",
          "hover:scale-[1.02]",
          "hover:[box-shadow:var(--lumina-shadow-hover)]",
          "active:translate-y-0",
          "active:scale-[0.98]",
        ].join(" "),

        outline: [
          "text-foreground",
          "border",
          "[border-color:var(--lumina-border-standard)]",
          "bg-transparent",
          "hover:[border-color:var(--lumina-border-emphasis)]",
          "hover:[background:var(--lumina-surface-interactive)]",
        ].join(" "),

        ghost: [
          "text-foreground/80",
          "bg-transparent",
          "hover:text-white",
          "hover:-translate-y-[2px]",
          "hover:[background:var(--lumina-surface-interactive)]",
          "hover:[box-shadow:var(--lumina-shadow-hover)]",
          "active:translate-y-0",
          "active:scale-[0.98]",
        ].join(" "),

        subtle: [
          "text-muted-foreground",
          "bg-transparent",
          "hover:text-white",
          "hover:[background:var(--lumina-surface-interactive)]",
        ].join(" "),
      },

      size: {
        sm: "h-9 px-4 rounded-xl text-[12px]",
        md: "h-10 px-5 rounded-xl text-[13px]",
        lg: "h-11 px-6 rounded-2xl text-[14px]",
        icon: "h-10 w-10 rounded-xl",
        pill: "h-10 px-5 rounded-full text-[13px]",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface LuminaButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof luminaButton> {}

export const LuminaButton = forwardRef<
  HTMLButtonElement,
  LuminaButtonProps
>(({ className, variant, size, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        luminaButton({
          variant,
          size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

LuminaButton.displayName = "LuminaButton";
