import { useEffect } from "react";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PlatformArchitecture } from "@/components/landing/PlatformArchitecture";
import { Features } from "@/components/landing/Features";
import { Comparison } from "@/components/landing/Comparison";
import { Templates } from "@/components/landing/Templates";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { onNav, type NavEvent } from "@/services/navigationService";
import { useWorkspace } from "@/context/WorkspaceContext";

export function LandingPage() {
  const { setView } = useWorkspace();

  useEffect(() => {
    const off = onNav((e: NavEvent) => {
      switch (e) {
        case "startBuilding":
        case "goToSignIn":
          setView("entry");
          break;
        case "goToPricing":
          setView("pricing");
          break;
        case "goToTemplates":
          setView("templates");
          break;
        case "goToDocs":
          document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
          break;
        case "watchDemo":
          document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        case "contactSales":
          window.location.href = "mailto:sales@korelumina.app?subject=KoreLumina%20Enterprise";
          break;
      }
    });
    return () => { off; };
  }, [setView]);

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden bg-transparent">
      {/* Centered background video at original aspect ratio */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none"
      >
        <BackgroundVideo
          src="/videos/landing-bg.mp4"
          className="w-[60%] max-w-[900px] h-auto object-contain"
        />
      </div>
      <div className="relative z-10">
        <LandingNav />
        <main>
          <Hero />
          <SocialProof />
          <ProblemSolution />
          <HowItWorks />
          <PlatformArchitecture />
          <Features />
          <Comparison />
          <Templates />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}