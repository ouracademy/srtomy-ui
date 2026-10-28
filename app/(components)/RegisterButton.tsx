import { Fab, FabProps } from "@mui/material";
import { forwardRef, ReactNode } from "react";

type IconsProps = {
  icon: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
} & Partial<FabProps>;

export const RegisterButton = forwardRef<HTMLButtonElement, IconsProps>(
  ({ icon, ariaLabel, onClick, ...props }, ref) => {
    return (
      <Fab
        {...props}
        ref={ref}
        aria-labelledby={ariaLabel}
        sx={{
          boxShadow: "none",
          // The colors of the theme, not their own: the icon buttons of an
          // event look like the rest of the page.
          background: "background.paper",
          color: "primary.main",
          border: "1px solid",
          borderColor: "primary.main",
          borderRadius: "20%",

          "&:hover": {
            background: "action.hover",
          },
        }}
        onClick={onClick}
      >
        {icon}
      </Fab>
    );
  },
);

RegisterButton.displayName = "RegisterButton";
