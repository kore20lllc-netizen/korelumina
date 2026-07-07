import {
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

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
};

const hover = {
  violet:
    "hover:border-violet/40 hover:shadow-[0_35px_90px_-30px_rgba(120,90,255,.45)]",
  magenta:
    "hover:border-fuchsia/40 hover:shadow-[0_35px_90px_-30px_rgba(255,80,190,.45)]",
  cyan:
    "hover:border-cyan/40 hover:shadow-[0_35px_90px_-30px_rgba(0,220,255,.40)]",
  gold:
    "hover:border-amber/40 hover:shadow-[0_35px_90px_-30px_rgba(255,190,70,.40)]",
};

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

const hostRef=useRef<HTMLDivElement|null>(null);

function handleClick(
e:MouseEvent<HTMLDivElement>,
){

const host=hostRef.current;

if(host){

const rect=host.getBoundingClientRect();

const size=Math.max(rect.width,rect.height);

const ripple=document.createElement("span");

ripple.className="glass-ripple";

ripple.style.width=`${size}px`;
ripple.style.height=`${size}px`;

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

<div
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

"border border-white/10",

"bg-[rgba(12,14,24,.42)]",

"backdrop-blur-[34px]",

"shadow-[0_20px_70px_rgba(0,0,0,.38)]",

"transition-all duration-500",

interactive &&
"cursor-pointer hover:-translate-y-1",

interactive &&
hover[accent],

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
className="pointer-events-none absolute inset-0 rounded-[30px]
bg-[linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.02)_22%,transparent_55%)]"
/>

<div
className="pointer-events-none absolute inset-[1px]
rounded-[29px]
border border-white/[0.08]"
/>

<div
className="pointer-events-none absolute
-left-24
-top-24
h-64
w-64
rounded-full
bg-white/6
blur-3xl"
/>

<div
className="pointer-events-none absolute
-right-16
-bottom-16
h-56
w-56
rounded-full
bg-violet/10
blur-3xl"
/>

<div
className="relative z-10">
{children}
</div>

</div>

);

},
);

GlowCard.displayName="GlowCard";
