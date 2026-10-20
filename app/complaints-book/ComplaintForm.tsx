"use client";

import { FormContainer, TextFieldElement, useForm } from "react-hook-form-mui";
import { Button, Typography, Grid } from "@mui/material";
import { sendComplaint } from "../(api)/services/complaints";
import React from "react";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const schema = z.object({
  firstName: z.string().trim().min(1, { message: "Escriba su nombre" }),
  lastName: z.string().trim().min(1, { message: "Escriba su apellido" }),
  dni: z.string().length(8, { message: "Escriba su DNI" }),
  address: z.string().trim().min(1, { message: "Registre su dirección" }),
  email: z.string(),
  comment: z.string(),
});

type ComplaintFormData = z.infer<typeof schema>;

type ComplaintFormProps = {
  initialValues: ComplaintFormData;
};

export default function ComplaintForm({ initialValues }: ComplaintFormProps) {
  const [active, setActive] = React.useState(false);

  const alert = React.useContext(SnackbarContext);

  const formContext = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  return (
    <FormContainer
      formContext={formContext}
      onSuccess={async (formValues) => {
        await sendComplaint({
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          dni: formValues.dni,
          address: formValues.address,
          email: formValues.email,
          comment: formValues.comment,
        });
        setActive(!active);
        alert.showMessage("Enviado");
      }}
    >
      <Grid container spacing={4} margin={4} sx={{ width: { sm: "600px" } }}>
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ fontSize: "40px" }}>Ingresa tus datos</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            name="firstName"
            label="Nombre"
            required
            fullWidth
            style={{ marginTop: "5px" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            name="lastName"
            label="Apellido"
            required
            fullWidth
            style={{ marginTop: "5px" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            name="dni"
            label="DNI"
            required
            fullWidth
            style={{ marginTop: "5px" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextFieldElement
            name="address"
            label="Dirección"
            required
            fullWidth
            style={{ marginTop: "5px" }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextFieldElement
            name="email"
            label="Email"
            type="email"
            required
            fullWidth
            style={{ marginTop: "5px" }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextFieldElement
            name="comment"
            label="Deja tu comentario"
            multiline
            rows={2}
            fullWidth
            style={{ marginTop: "5px" }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={active}
            // style={{ background: "#000" }}
          >
            Enviar Mensaje
          </Button>
        </Grid>
      </Grid>
    </FormContainer>
  );
}
