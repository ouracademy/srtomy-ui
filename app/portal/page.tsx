"use client";

import { useAuth0 } from "@auth0/auth0-react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChurchIcon from "@mui/icons-material/Church";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { FormContainer, TextFieldElement, useForm } from "react-hook-form-mui";
import { createOrganization } from "../(api)/services/organizations";
import { SnackbarContext } from "../(components)/SnackbarContext";
import MenuDrawer from "./MenuDrawer";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function PortalHome() {
  const [openCreateChurchDialog, setOpenCreateChurchDialog] = useState(false);
  const { user } = useAuth0();

  const hasOrgId = Boolean(user?.["https://sr-tommy.com/orgId"]);

  return (
    <main style={{ margin: "24px" }}>
      <Box>
        <MenuDrawer
          listDrawer={
            <List>
              <ListItem sx={{ display: "flex", flexDirection: "column" }}>
                <blockquote style={{ margin: ".5rem", color: "#fff" }}>
                  Mejores son dos que uno; porque tienen mejor paga de su
                  trabajo. Porque si caen, el uno levantará a su compañero; pero
                  ¡ay del solo! que cuando caiga, no habrá segundo que lo
                  levante.
                  <br />
                  <br />
                  <em>Eclesiastés 4:9-10 (Reina-Valera 1960)</em>
                </blockquote>
              </ListItem>
            </List>
          }
        >
          <Typography variant="h3" gutterBottom>
            Bienvenido
          </Typography>
          <p>
            Siga los siguientes pasos para dar un gran salto en la
            administración de su iglesia
          </p>
          <Typography variant="h4" gutterBottom>
            Pasos
          </Typography>
          <Stack spacing={2}>
            <Paper sx={{ display: "flex", padding: 4 }}>
              <ChurchIcon fontSize="large" />
              <Box pl={2}>
                <Box
                  pl={1}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  Registre su iglesia junto a sus sedes o solicite entrar a una
                  {hasOrgId && <CheckCircleOutlineIcon color="success" />}
                </Box>
                {!hasOrgId && (
                  <Button
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => setOpenCreateChurchDialog(true)}
                  >
                    Registrar iglesia
                  </Button>
                )}
              </Box>
            </Paper>
          </Stack>
        </MenuDrawer>
      </Box>
      <CreateChurchDialog
        open={openCreateChurchDialog}
        onClose={() => setOpenCreateChurchDialog(false)}
      />
    </main>
  );
}

const CreateChurchDialog = ({
  onClose,
  open,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const alert = useContext(SnackbarContext);
  const { user } = useAuth0();

  const formContext = useForm({
    defaultValues: {
      name: "",
    },
  });

  const onCreate = async (data: { name: string }) => {
    await createOrganization({ name: data.name, userId: user?.sub });

    onClose();
    alert.showMessage("Iglesia exitosamente registrada");
    router.push("/portal/location/create");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Registrar iglesia</DialogTitle>
      <FormContainer formContext={formContext} onSuccess={onCreate}>
        <DialogContent>
          <TextFieldElement name="name" label="Nombre" required fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Registrar
          </Button>
        </DialogActions>
      </FormContainer>
    </Dialog>
  );
};
