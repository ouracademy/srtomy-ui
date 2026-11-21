"use client";

import { apiErrorStatus } from "@/app/(api)/apiError";
import { useSWRConfig } from "swr";
import { ErrorMessage } from "./ErrorMessage";
import { NotFoundMessage } from "./NotFoundMessage";

type ResourceErrorProps = Readonly<{
  error: unknown;
  onRetry?: () => void;
}>;

// What to show when a request finished (not loading) and there is no data:
// a 404 means the resource does not exist, anything else is a failure.
export const ResourceError = ({ error, onRetry }: ResourceErrorProps) => {
  const { mutate } = useSWRConfig();
  // Without a custom retry, revalidate every SWR key of the page.
  const retry = onRetry ?? (() => mutate(() => true));

  if (apiErrorStatus(error) === 404) {
    return (
      <NotFoundMessage
        title="No encontrado"
        message="No existe lo que buscas o fue eliminado."
      />
    );
  }

  return (
    <ErrorMessage
      title="No se pudo cargar"
      message="No pudimos obtener la información. Puedes intentarlo de nuevo."
      onRetry={retry}
    />
  );
};
