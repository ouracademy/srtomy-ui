import ChurchOutlined from "@mui/icons-material/ChurchOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import MusicNoteOutlined from "@mui/icons-material/MusicNoteOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import VolunteerActivismOutlined from "@mui/icons-material/VolunteerActivismOutlined";
import { describe, expect, it } from "vitest";
import { placeIconFor } from "./placeIcon";

describe("placeIconFor", () => {
  it("picks the icon from the words of the name, ignoring case and accents", () => {
    expect(placeIconFor("Alabanza", "MINISTRY")).toBe(MusicNoteOutlined);
    expect(placeIconFor("Jóvenes", "GROUP")).toBe(GroupsOutlined);
    expect(placeIconFor("GRUPO JUVENIL", "MINISTRY")).toBe(GroupsOutlined);
  });

  it("falls back to the type of the place", () => {
    expect(placeIconFor("Sede principal", "LOCATION")).toBe(PlaceOutlined);
    expect(placeIconFor("IgleArt", "CHURCH")).toBe(ChurchOutlined);
    expect(placeIconFor("Intercesión", "MINISTRY")).toBe(
      VolunteerActivismOutlined,
    );
  });

  it("still returns an icon when nothing is known", () => {
    expect(placeIconFor(undefined, undefined)).toBe(GroupsOutlined);
  });
});
