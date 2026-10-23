import LoadingButton from "@mui/lab/LoadingButton";

type SaveButtonProps = Readonly<{
  name: string;
  // True while the API call runs: shows a spinner and blocks a second click.
  loading?: boolean;
  onClick?: () => void;
}>;

export const SaveButton = ({
  name,
  loading = false,
  onClick,
}: SaveButtonProps) => {
  return (
    <LoadingButton
      type="submit"
      loading={loading}
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
    </LoadingButton>
  );
};
