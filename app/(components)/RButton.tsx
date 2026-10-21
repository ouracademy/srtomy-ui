import { Button } from "@mui/material";
import Link from "next/link";

interface RButtonProps {
  name: string;
  href: string;
  padding?: string;
}

export const RButton = ({ name, href, padding }: RButtonProps) => {
  return (
    <Button
      variant="contained"
      component={Link}
      href={href}
      sx={{
        fontSize: "12px",
        marginRight: "20px",
        padding: padding || "0px 40px",
        background: "#3B82F6",
        color: "#fff",

        //
      }}
    >
      {name}
    </Button>
  );
};
