import { Box, Stack, Typography } from "@mui/material";
import {
  FormContainer,
  RadioButtonGroup,
  TextFieldElement,
  useForm,
} from "react-hook-form-mui";
import React from "react";
import { GroupTypeLabels } from "./Group";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SaveButton } from "@/app/(components)/SaveButton";
import { socialLinksSchema } from "@/app/(components)/SocialLinks";
import { SocialLinksFields } from "@/app/(components)/SocialLinksFields";
import { VisibilityFields } from "@/app/(components)/VisibilityFields";
import { visibilitySchema } from "@/app/(components)/visibility";

const baseSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Por favor ingrese el nombre del Grupo o ministerio" }),
  description: z.string().optional(),
  type: z.enum(["GROUP", "MINISTRY"]),
  ...visibilitySchema.shape,
  socialLinks: socialLinksSchema,
});

export const initialValuesSchema = baseSchema;

export type GroupInitialValues = z.infer<typeof initialValuesSchema>;

type GroupFormContext = {
  initialValues: GroupInitialValues;
  submit: (data: GroupInitialValues) => Promise<void>;
  canSave?: boolean;
  // Address of the public page, to show and copy.
  slug?: string;
  onCopy?: (url: string) => void;
};

export const GroupForm = ({
  submit,
  initialValues,
  canSave = true,
  slug,
  onCopy,
}: GroupFormContext) => {
  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(initialValuesSchema),
  });

  return (
    <FormContainer formContext={formContext} onSuccess={submit}>
      <Box sx={{ maxWidth: 700, margin: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" gutterBottom>
            Datos generales del Grupo / Ministerio
          </Typography>
          <TextFieldElement fullWidth name="name" label="Nombre" required />
          <TextFieldElement
            fullWidth
            name="description"
            label="Descripción"
            multiline
            rows={4}
          />
          <RadioButtonGroup
            label="Tipo"
            name="type"
            options={[
              { id: "GROUP", label: GroupTypeLabels.GROUP },
              { id: "MINISTRY", label: GroupTypeLabels.MINISTRY },
            ]}
            row
          />
          <SocialLinksFields prefix="socialLinks" />
          <VisibilityFields slug={slug} onCopy={onCopy} />
          {canSave && (
            <Box>
              <SaveButton
                name="Guardar"
                loading={formContext.formState.isSubmitting}
              />
            </Box>
          )}
        </Stack>
      </Box>
    </FormContainer>
  );
};
