import type { Metadata } from "next";
import { LegalDocument } from "../(components)/LegalDocument";
import { LegalLayout } from "../landing/LegalLayout";
import { termsContent } from "./content";

export const metadata: Metadata = {
  title: termsContent.title,
  alternates: { canonical: "/terms-conditions" },
};

export default function TermsConditions() {
  return (
    <LegalLayout>
      <LegalDocument {...termsContent} />
    </LegalLayout>
  );
}
