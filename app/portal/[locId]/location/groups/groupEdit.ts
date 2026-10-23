import type {
  GetOrganizationsLocationsChildsByIdMembers200,
  OrganizationResponse,
  UpdateLocationChildRequest,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import type { GroupInitialValues } from "./GroupForm";

const personLabel = (person: { firstName?: string; lastName?: string }) =>
  [person.firstName, person.lastName].filter(Boolean).join(" ");

// Maps a group and its members (from the members endpoint) to the form values.
export const toGroupInitialValues = (
  group: OrganizationResponse,
  members: GetOrganizationsLocationsChildsByIdMembers200,
): GroupInitialValues => ({
  name: group.name ?? "",
  description: group.description ?? "",
  type: group.type === "MINISTRY" ? "MINISTRY" : "GROUP",
  members: (members.IS_PART_OF ?? []).map((x) => ({
    id: x.id ?? "",
    label: personLabel(x),
  })),
  leaders: (members.LEADER ?? []).map((x) => ({
    id: x.id ?? "",
    label: personLabel(x),
  })),
});

// Builds the body of PUT /organizations/locations/childs/{id} from the form values.
export const toUpdateLocationChildRequest = (
  values: GroupInitialValues,
): UpdateLocationChildRequest => ({
  name: values.name,
  description: values.description,
  type: values.type,
  leaderIds: values.leaders.map((x) => x.id),
  memberIds: values.members.map((x) => x.id),
});
