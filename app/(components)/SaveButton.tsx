import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";

type SaveButtonProps = Readonly<{
  name: string;
  // True while the API call runs: shows a spinner and blocks a second click.
  loading?: boolean;
  // Shows the standard "+" icon: use it on buttons that add something.
  add?: boolean;
  onClick?: () => void;
}>;

export const SaveButton = ({
  name,
  loading = false,
  add = false,
  onClick,
}: SaveButtonProps) => {
  return (
    <Button
      type="submit"
      loading={loading}
      startIcon={add ? <AddIcon /> : undefined}
      sx={{
        padding: "10px 40px",
        // #2563EB on white is 5.2:1 (WCAG AA needs 4.5:1 at this font size).
        background: "#2563EB",
        color: "#fff",
        fontSize: "12px",
        "&:hover": { background: "#1D4ED8" },
      }}
      onClick={onClick}
    >
      {name}
    </Button>
  );
};
