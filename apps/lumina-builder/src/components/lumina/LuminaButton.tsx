import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const luminaButton = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight transition-all duration-300 ease-fluid select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40",
  {
    variants: {
      variant: {
        primary:
          "text-white border border-violet/30 " +
          "bg-[linear-gradient(180deg,hsl(258_100%_74%),hsl(250_72%_56%))] " +
          "shadow-[0_10px_30px_-10px_hsl(258_100%_70%/.70),inset_0_1px_0_rgba(255,255,255,.35)] " +
          "hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_16px_38px_-12px_hsl(258_100%_70%/.90)]",

        success:
          "text-white border border-emerald-400/30 " +
          "bg-[linear-gradient(180deg,hsl(152_78%_48%),hsl(158_72%_33%))] " +
          "shadow-[0_10px_30px_-10px_hsl(155_85%_45%/.70),inset_0_1px_0_rgba(255,255,255,.30)] " +
          "hover:-translate-y-[1px] hover:brightness-110",

        warning:
          "text-white border border-amber-400/30 " +
          "bg-[linear-gradient(180deg,hsl(42_100%_58%),hsl(34_95%_47%))] " +
          "shadow-[0_10px_30px_-10px_hsl(40_100%_55%/.65),inset_0_1px_0_rgba(255,255,255,.30)] " +
          "hover:-translate-y-[1px] hover:brightness-110",

        danger:
          "text-white border border-red-400/30 " +
          "bg-[linear-gradient(180deg,hsl(0_85%_60%),hsl(0_72%_48%))] " +
          "shadow-[0_10px_30px_-10px_hsl(0_85%_55%/.70),inset_0_1px_0_rgba(255,255,255,.25)] " +
          "hover:-translate-y-[1px] hover:brightness-110",

        toolbar:
          "text-white border border-white/10 " +
          "bg-[linear-gradient(180deg,#2b3144,#1c2233)] " +
          "shadow-[0_8px_22px_-10px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.08)] " +
          "hover:border-violet/30 hover:bg-[linear-gradient(180deg,#373f59,#242b3d)]",

        glow:
          "text-foreground border border-white/12 " +
          "bg-[linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04))] " +
          "backdrop-blur-xl " +
          "shadow-[0_10px_30px_-14px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.12)] " +
          "hover:border-violet/35 hover:bg-[linear-gradient(180deg,rgba(124,92,255,.22),rgba(124,92,255,.08))] " +
          "hover:shadow-[0_0_24px_rgba(124,92,255,.30)]",

        outline:
          "text-foreground border border-white/14 bg-transparent hover:border-violet/40 hover:bg-white/[0.04]",

        ghost:
          "text-foreground/80 bg-transparent hover:bg-white/[0.06] hover:text-white",

        subtle:
          "text-muted-foreground bg-transparent hover:bg-white/[0.04] hover:text-white",
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
