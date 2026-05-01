import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MeshBackground from "./_components/mesh-bg";
import Navbar from "./_landing/navbar";
import Hero from "./_landing/hero";
import HowItWorks from "./_landing/how-it-works";
import FeaturesSection from "./_landing/features-section";
import Testimonials from "./_landing/testimonials";
import PricingSection from "./_landing/pricing-section";
import FAQ from "./_landing/faq";
import CTABanner from "./_landing/cta-banner";
import Footer from "./_landing/footer";

export const metadata = {
  title: "Nexora Outreach — AI Cold Email at Scale",
  description:
    "Signal-triggered cold outreach that converts. Nexora monitors 50+ data sources, writes hyper-personalized emails, and sends follow-ups automatically.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div
      style={{
        backgroundColor: "#080810",
        minHeight: "100dvh",
        color: "#fff",
        fontFamily: "var(--font-outfit)",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <MeshBackground />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturesSection />
        <Testimonials />
        <PricingSection />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
