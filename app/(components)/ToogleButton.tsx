import { Button } from "@mui/material";

type ToogleButtonProps = {
  onChange: (eventType: number) => void;
  eventType: number;
};

export const ToogleButton = ({ onChange, eventType }: ToogleButtonProps) => {
  const mainColor = "#3B82F6";
  return (
    <>
      <Button
        sx={{
          mr: 1,
          mb: 1,
          //Fondo
          backgroundColor: eventType === 0 ? mainColor : "transparent",
          //Texto
          color: eventType === 0 ? "#fff" : mainColor,
          border: `1px solid ${mainColor}`,
        }}
        onClick={() => onChange(0)}
      >
        Evento
      </Button>
      <Button
        sx={{
          mb: 1,
          //fondo
          backgroundColor: eventType === 1 ? mainColor : "transparent",
          //texto
          color: eventType === 1 ? "#fff" : mainColor,
          border: `1px solid ${mainColor}`,
        }}
        onClick={() => onChange(1)}
      >
        Curso
      </Button>
    </>
  );
};
