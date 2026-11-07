import type { Metadata } from "next";
import { LegalDocument } from "../(components)/LegalDocument";
import { LegalLayout } from "../landing/LegalLayout";
import { privacyContent } from "./content";

export const metadata: Metadata = {
  title: privacyContent.title,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout>
      <LegalDocument {...privacyContent} />
    </LegalLayout>
  );
}
