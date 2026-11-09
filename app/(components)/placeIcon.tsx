import ChildCareOutlined from "@mui/icons-material/ChildCareOutlined";
import ChurchOutlined from "@mui/icons-material/ChurchOutlined";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import MusicNoteOutlined from "@mui/icons-material/MusicNoteOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import VolunteerActivismOutlined from "@mui/icons-material/VolunteerActivismOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material";
import { createElement } from "react";

// Icon of a sede, grupo or ministerio until it can have its own image: the
// words of its name decide (jóvenes, alabanza...) and its type is the fallback.
const byKeyword: { words: RegExp; icon: SvgIconComponent }[] = [
  { words: /alabanza|musica|worship|adoracion|coro/, icon: MusicNoteOutlined },
  { words: /joven|juvenil|youth|adolescente/, icon: GroupsOutlined },
  { words: /nino|infantil|kids|peque/, icon: ChildCareOutlined },
  { words: /matrimonio|pareja|familia/, icon: FavoriteBorder },
];

const byType: Record<string, SvgIconComponent> = {
  CHURCH: ChurchOutlined,
  LOCATION: PlaceOutlined,
  GROUP: GroupsOutlined,
  MINISTRY: VolunteerActivismOutlined,
};

const normalize = (text: string) =>
  text.normalize("NFD").replaceAll(/[̀-ͯ]/g, "").toLowerCase();

export const placeIconFor = (
  name: string | undefined,
  type: string | undefined,
): SvgIconComponent => {
  const text = normalize(name ?? "");
  return (
    byKeyword.find(({ words }) => words.test(text))?.icon ??
    byType[type ?? ""] ??
    GroupsOutlined
  );
};

// The icon of a place as an element: the choice is made by name and type, so
// the caller does not build a component while rendering.
export const PlaceIcon = ({
  name,
  type,
  ...props
}: Readonly<{ name?: string; type?: string } & SvgIconProps>) =>
  createElement(placeIconFor(name, type), props);
