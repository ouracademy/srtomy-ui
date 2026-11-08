"use client";

import { Grid, Typography } from "@mui/material";
import { FormContainer, TextFieldElement, useForm } from "react-hook-form-mui";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SocialLinksFields } from "@/app/(components)/SocialLinksFields";
import { TelFieldElement } from "@/app/(components)/TelFieldElement";
import { VisibilityFields } from "@/app/(components)/VisibilityFields";
import {
  organizationSchema,
  type OrganizationDetailForm,
} from "./LocationSchema";

type LocationFormProps = {
  title: string;
  initialValues: OrganizationDetailForm;
  submit: (data: OrganizationDetailForm) => Promise<void>;
  // Without permission to edit, the data is shown but cannot be saved.
  canSave?: boolean;
  // Address of the public page, to show and copy.
  slug?: string;
  onCopy?: (url: string) => void;
};

// Name, contact and links of a church or a location.
export const LocationForm = ({
  title,
  submit,
  initialValues,
  canSave = true,
  slug,
  onCopy,
}: LocationFormProps) => {
  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(organizationSchema),
  });

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Grid
        container
        spacing={2}
        sx={{
          margin: 4,
        }}
      >
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement name="name" label="Nombre" required fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement name="address" label="Dirección" fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TelFieldElement name="phoneNumber" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SocialLinksFields prefix="socialLinks" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <VisibilityFields orgChart slug={slug} onCopy={onCopy} />
        </Grid>
        {canSave && (
          <Grid size={{ xs: 12 }}>
            <SaveButton
              name="Guardar"
              loading={formContext.formState.isSubmitting}
            />
          </Grid>
        )}
      </Grid>
    </FormContainer>
  );
};
