import { useEffect } from "react";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { InfrastructureYourWay } from "@/components/landing/InfrastructureYourWay";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PlatformArchitecture } from "@/components/landing/PlatformArchitecture";
import { Features } from "@/components/landing/Features";
import { InHouseDevelopers } from "@/components/landing/InHouseDevelopers";
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
    const unsubscribe = onNav((event: NavEvent) => {
      switch (event.type) {
        case "view":
          setView(event.view);
          break;

        case "scroll":
          document
            .getElementById(event.targetId)
            ?.scrollIntoView({
              behavior: "smooth",
              block: event.block ?? "start",
            });
          break;

        case "external":
          window.open(
            event.url,
            event.target ?? "_blank",
            event.features ?? "noopener,noreferrer",
          );
          break;

        case "mailto":
          window.location.href = event.href;
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, [setView]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-foreground">
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
          <InfrastructureYourWay />
          <SocialProof />
          <ProblemSolution />
          <HowItWorks />
          <PlatformArchitecture />
          <Features />
          <Comparison />
          <Templates />
          <InHouseDevelopers />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>

        <Footer />
      </div>
    </div>
  );
}
