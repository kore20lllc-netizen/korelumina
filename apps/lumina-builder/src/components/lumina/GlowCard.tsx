import {
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  useRef,
} from "react";

import {
  LuminaSurface,
} from "@/components/lumina/surface";

import {
  cn,
} from "@/lib/utils";

interface GlowCardProps
  extends HTMLAttributes<HTMLDivElement> {
  accent?: "violet" | "magenta" | "cyan" | "gold";
  interactive?: boolean;
}

const ambient = {
  violet:
    "from-violet/18 via-fuchsia/8 to-transparent",
  magenta:
    "from-fuchsia/20 via-pink/8 to-transparent",
  cyan:
    "from-cyan/18 via-sky/8 to-transparent",
  gold:
    "from-amber/18 via-yellow/8 to-transparent",
} as const;

export const GlowCard =
forwardRef<HTMLDivElement, GlowCardProps>(
function GlowCard(
{
  className,
  accent="violet",
  interactive=false,
  children,
  onClick,
  ...props
},
ref,
){

const hostRef=
useRef<HTMLDivElement|null>(null);

function handleClick(
e:MouseEvent<HTMLDivElement>,
){

const host=hostRef.current;

if(host){

const rect=
host.getBoundingClientRect();

const size=
Math.max(
rect.width,
rect.height,
);

const ripple=
document.createElement("span");

ripple.className=
"glass-ripple";

ripple.style.width=
`${size}px`;

ripple.style.height=
`${size}px`;

ripple.style.left=
`${e.clientX-rect.left-size/2}px`;

ripple.style.top=
`${e.clientY-rect.top-size/2}px`;

host.appendChild(ripple);

window.setTimeout(
()=>ripple.remove(),
900,
);

}

onClick?.(e);

}

return(

<LuminaSurface
variant={
interactive
? "interactive"
: "card"
}
ref={(node)=>{

hostRef.current=node;

if(typeof ref==="function"){

ref(node);

}else if(ref){

ref.current=node;

}

}}
onClick={handleClick}
className={cn(

"relative overflow-hidden",

"rounded-[30px]",

"[background:var(--lumina-surface-card)]",

className,

)}
{...props}
>

<div
className={cn(
"pointer-events-none absolute inset-0",
"bg-gradient-to-br",
ambient[accent],
)}
/>

<div
className="
pointer-events-none
absolute
inset-0
rounded-[30px]
[background:var(--lumina-highlight-overlay)]
"
/>

<div
className="
pointer-events-none
absolute
inset-[1px]
rounded-[29px]
border
[border-color:var(--lumina-border-standard)]
"
/>

<div
className="
pointer-events-none
absolute
-left-24
-top-24
h-64
w-64
rounded-full
[background:var(--lumina-ambient-primary)]
opacity-[var(--lumina-ambient-opacity)]
blur-3xl
"
/>

<div
className="
pointer-events-none
absolute
-right-16
-bottom-16
h-56
w-56
rounded-full
[background:var(--lumina-ambient-secondary)]
opacity-[calc(var(--lumina-ambient-opacity)*0.8)]
blur-3xl
"
/>

<div
className="
relative
z-10
"
>
{children}
</div>

</LuminaSurface>

);

},
);

GlowCard.displayName=
"GlowCard";
