import { LandingPage } from "./landing/LandingPage";
import { siteDescription, siteName, siteUrl } from "./site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}
