import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupsIcon from "@mui/icons-material/Groups";
import { Typography } from "@mui/material";
import { ToggleButtonGroupElement, useWatch } from "react-hook-form-mui";
import { GroupTypeLabels } from "./Group";

type GroupType = keyof typeof GroupTypeLabels;

const typeHints: Record<GroupType, string> = {
  GROUP:
    "personas que se reúnen con regularidad, como una célula, una clase o un equipo.",
  MINISTRY: "área de servicio a la iglesia, como alabanza, niños o ujieres.",
};

// Slow, soft return with a small overshoot: the button gives under the click
// and settles back. It lives in `transition`, so it only runs on a press.
const settle = "transform .5s cubic-bezier(.34, 1.56, .64, 1)";

// Grupo or Ministerio, as two separate buttons beside the name.
export const GroupTypeSelector = ({ disabled }: { disabled?: boolean }) => (
  <ToggleButtonGroupElement
    name="type"
    aria-label="Tipo"
    exclusive
    enforceAtLeastOneSelected
    disabled={disabled}
    sx={{
      height: 56,
      gap: 1.25,
      // MUI glues the buttons of a group together; they stay apart here.
      "&&& .MuiToggleButton-root": {
        minWidth: 132,
        gap: 1,
        px: 2.25,
        marginLeft: 0,
        border: 1.5,
        borderStyle: "solid",
        borderColor: "grey.400",
        borderRadius: 2,
        color: "text.primary",
        fontWeight: 600,
        letterSpacing: "0.06em",
        transition: `${settle}, background-color .3s ease, border-color .3s ease, color .3s ease`,
        "&:hover": { bgcolor: "transparent" },
        "&:active:not(.Mui-disabled)": {
          transform: "scale(.96)",
          transition: "transform .12s ease-out",
        },
        // The default selected look (primary text on a pale wash) is under
        // the 4.5:1 contrast of WCAG AA.
        "&.Mui-selected": {
          bgcolor: "primary.dark",
          borderColor: "primary.dark",
          color: "#ffffff",
          "&:hover": { bgcolor: "primary.dark" },
        },
        "&.Mui-disabled": { opacity: 0.55, color: "text.primary" },
        "&.Mui-selected.Mui-disabled": { color: "#ffffff" },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:active:not(.Mui-disabled)": { transform: "none" },
        },
      },
    }}
    options={[
      {
        id: "GROUP",
        label: (
          <>
            <GroupsIcon fontSize="small" />
            {GroupTypeLabels.GROUP}
          </>
        ),
      },
      {
        id: "MINISTRY",
        label: (
          <>
            <FavoriteIcon fontSize="small" />
            {GroupTypeLabels.MINISTRY}
          </>
        ),
      },
    ]}
  />
);

// One line under the name row that says what the chosen type is.
export const GroupTypeHint = () => {
  const type = useWatch({ name: "type" }) as GroupType;
  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      <Typography
        component="b"
        variant="body2"
        sx={{ fontWeight: 600, color: "text.primary" }}
      >
        {GroupTypeLabels[type]}:
      </Typography>{" "}
      {typeHints[type]}
    </Typography>
  );
};
