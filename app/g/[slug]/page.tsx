"use client";

import React from "react";
import { useGetPublicOrganizationsBySlug } from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { PublicPage } from "./PublicPage";

// Public page of a church, location, group or ministry (/g/{slug}). Anyone
// with the link can open it; one that is not public answers 404.
export default function PublicNodePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(props.params);
  const { data, error, isLoading } = useGetPublicOrganizationsBySlug(slug);

  if (isLoading) return <Loading />;
  if (!data) return <ResourceError error={error} />;
  return <PublicPage page={data} />;
}
