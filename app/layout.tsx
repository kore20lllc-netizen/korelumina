import type { Metadata } from "next";
import "./globals.css";
import "@/lib/env-validation"; // Boot-time environment validation
import BuildIdentifier from "@/components/BuildIdentifier";
if (process.env.VERCEL_ENV === "production") {
  console.log(
    "[DEPLOY]",
    "commit:",
    process.env.VERCEL_GIT_COMMIT_SHA,
    "env:",
    process.env.VERCEL_ENV
  );
}

export const metadata: Metadata = {
  title: "Kore Lumina - Build Apps with AI",
  description: "Premium AI-powered app builder. Create production-ready applications with natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <BuildIdentifier />
      </body>
    </html>
  );
}
