import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupsIcon from "@mui/icons-material/Groups";
import { Typography } from "@mui/material";
import { ToggleButtonGroupElement, useWatch } from "react-hook-form-mui";
import { typeButtonsSx } from "@/app/(components)/typeButtonsSx";
import { GroupTypeLabels } from "./Group";

type GroupType = keyof typeof GroupTypeLabels;

const typeHints: Record<GroupType, string> = {
  GROUP:
    "personas que se reúnen con regularidad, como una célula, una clase o un equipo.",
  MINISTRY: "área de servicio a la iglesia, como alabanza, niños o ujieres.",
};

// Grupo or Ministerio, as two separate buttons beside the name.
export const GroupTypeSelector = ({ disabled }: { disabled?: boolean }) => (
  <ToggleButtonGroupElement
    name="type"
    aria-label="Tipo"
    exclusive
    enforceAtLeastOneSelected
    disabled={disabled}
    sx={typeButtonsSx(56)}
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
