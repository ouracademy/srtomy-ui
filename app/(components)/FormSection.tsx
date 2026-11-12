import type { ReactNode } from "react";
import { Paper, Typography } from "@mui/material";

type FormSectionProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>;

// A titled block of a form: a card with what it asks for and why.
export const FormSection = ({
  title,
  description,
  children,
}: FormSectionProps) => (
  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
    <Typography variant="h6" component="h2">
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
      {description}
    </Typography>
    {children}
  </Paper>
);
