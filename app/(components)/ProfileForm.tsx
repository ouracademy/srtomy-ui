import { useAuth0 } from "@auth0/auth0-react";
import { Typography, Grid } from "@mui/material";
import { FormContainer, TextFieldElement } from "react-hook-form-mui";

export const ProfileForm = () => {
  const { user } = useAuth0();

  return (
    <FormContainer
      values={{
        email: user?.email,
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" gutterBottom>
            Perfil
          </Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextFieldElement name="email" label="Email" type="email" fullWidth />
        </Grid>
      </Grid>
    </FormContainer>
  );
};
