import { RenderBuilderContent } from "@/components/builder";
import { builder } from "@builder.io/sdk";
import LandingLayout from "./landing-layout";
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

// Builder Public API Key set in .env file
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export default async function Home() {
  const content = await builder
    // Get the page content from Builder with the specified options
    .get("page", {
      userAttributes: {
        // Use the page path specified in the URL to fetch the content
        urlPath: "/",
      },
    })
    // Convert the result to a promise
    .toPromise();

  return (
    <LandingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Render the Builder page */}
      <RenderBuilderContent content={content} />
    </LandingLayout>
  );
}
