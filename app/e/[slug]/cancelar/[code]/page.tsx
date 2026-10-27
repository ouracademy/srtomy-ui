"use client";

import React from "react";
import { deletePublicRegistrationsByCancelCode } from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { CancelRegistrationPage } from "./CancelRegistrationPage";

// /e/{slug}/cancelar/{code}: the link to cancel a sign-up, for whoever kept it.
export default function CancelRegistrationRoute(props: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = React.use(props.params);

  return (
    <CancelRegistrationPage
      slug={slug}
      onCancel={async () => {
        try {
          await deletePublicRegistrationsByCancelCode(code);
          return null;
        } catch (failure) {
          return apiErrorMessage(
            failure,
            "No se encontró la inscripción. Quizá ya se canceló",
          );
        }
      }}
    />
  );
}
