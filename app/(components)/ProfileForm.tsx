import { useAuth0 } from "@auth0/auth0-react";
import { Typography, Grid } from "@mui/material";
import Script from "next/script";
import { FormContainer, TextFieldElement } from "react-hook-form-mui";
import { env } from "../env";

const publicKey = env.NEXT_PUBLIC_CULQI_API_KEY || "some other culqi key";

export const ProfileForm = () => {
  const { user } = useAuth0();

  return (
    <FormContainer
      values={{
        email: user?.email,
      }}
    >
      <Grid container spacing={2} margin={4}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" gutterBottom>
            Perfil
          </Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextFieldElement name="email" label="Email" type="email" fullWidth />
        </Grid>
      </Grid>
      <Script
        src="https://js.culqi.com/checkout-js"
        onLoad={() => {
          const settings = {
            title: "Culqi  store 2",
            currency: "PEN", // Este parámetro es requerido para realizar pagos yape
            amount: 120 * 100, // Este parámetro es requerido para realizar pagos yape(80.00)
            order: "ord_live_d1P0Tu1n7Od4nZdp", // Este parámetro es requerido para realizar pagos con pagoEfectivo, billeteras y Cuotéalo
          };

          const client = {
            email: "test2@demo.com",
          };

          const paymentMethods = {
            // las opciones se ordenan según se configuren
            tarjeta: true,
            yape: false,
            billetera: false,
            bancaMovil: false,
            agente: false,
            cuotealo: false,
          };

          const options = {
            lang: "auto",
            installments: true, // Habilitar o deshabilitar el campo de cuotas
            modal: false,
            container: "#culqi-container", // Opcional - Div donde quieres cargar el checkout
            paymentMethods: paymentMethods,
            paymentMethodsSort: Object.keys(paymentMethods), // las opciones se ordenan según se configuren en paymentMethods
          };

          const appearance = {
            theme: "default",
            hiddenCulqiLogo: false,
            hiddenBannerContent: false,
            hiddenBanner: true,
            hiddenToolBarAmount: false,
            menuType: "sidebar", // sidebar / sliderTop / select
            buttonCardPayText: "Pagar monto", //
            logo: null, // 'http://www.childrensociety.ms/wp-content/uploads/2019/11/MCS-Logo-2019-no-text.jpg',
          };

          const config = {
            settings,
            client,
            options,
            appearance,
          };

          const Culqi = new CulqiCheckout(publicKey, config);
          Culqi.open();

          const handleCulqiAction = () => {
            if (Culqi.token) {
              // The token is not sent to the API yet (payments are not wired).
              Culqi.close();
            } else if (Culqi.order) {
              Culqi.close();
            } else {
              console.error("Culqi error", Culqi.error);
            }
          };

          Culqi.culqi = handleCulqiAction;
        }}
      />
    </FormContainer>
  );
};
