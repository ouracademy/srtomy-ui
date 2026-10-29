import { useGetMePermissions } from "@/app/(api)/generated";

// Permissions the signed-in user holds on a node (inherited ones included), to
// show or hide actions. Only cosmetic: the API checks every request anyway.
export type Permission =
  | "org.read"
  | "org.update"
  | "org.create_child"
  | "org.delete"
  | "members.read"
  | "members.write"
  | "members.delete"
  | "events.read"
  | "events.write"
  | "attendance.write"
  | "registrations.read"
  | "registrations.configure"
  | "registrations.close"
  | "registrations.remove"
  | "positions.manage"
  | "iam.read"
  | "iam.manage"
  | "invitations.send";

// What every member holds just for belonging to a node. Anything beyond it
// means the person helps run something, so the portal opens the node for them.
const memberPermissions: readonly Permission[] = ["org.read", "events.read"];

/** Whether the permissions include any beyond the plain Member level. */
export const hasManagementAccess = (permissions: readonly string[]) =>
  permissions.some(
    (permission) => !memberPermissions.includes(permission as Permission),
  );

export const usePermissions = (organizationId: string | undefined) => {
  const { data, isLoading } = useGetMePermissions(
    { organizationId: organizationId ?? "" },
    { swr: { enabled: Boolean(organizationId) } },
  );
  return {
    isLoading,
    permissions: data ?? [],
    can: (permission: Permission) => (data ?? []).includes(permission),
  };
};
