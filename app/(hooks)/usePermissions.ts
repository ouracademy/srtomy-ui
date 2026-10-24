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
  | "events.read"
  | "events.write"
  | "attendance.write"
  | "positions.manage"
  | "iam.read"
  | "iam.manage";

export const usePermissions = (organizationId: string | undefined) => {
  const { data, isLoading } = useGetMePermissions(
    { organizationId: organizationId ?? "" },
    { swr: { enabled: Boolean(organizationId) } },
  );
  return {
    isLoading,
    can: (permission: Permission) => (data ?? []).includes(permission),
  };
};
