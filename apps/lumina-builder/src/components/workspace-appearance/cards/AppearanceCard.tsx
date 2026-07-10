import type { ReactNode } from "react";

interface AppearanceCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}

export function AppearanceCard({
  icon,
  title,
  description,
  children,
}: AppearanceCardProps) {
  return (
    <section
      className="
        rounded-[28px]
        border
        border-white/15
        bg-[rgba(12,14,24,.72)]
        p-5
        backdrop-blur-2xl
        shadow-[0_0_40px_rgba(98,76,255,.12)]
      "
    >
      <div className="mb-5 flex items-start gap-3">
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-2xl
            bg-white/5
            text-amber-300
          "
        >
          {icon}
        </div>

        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}
