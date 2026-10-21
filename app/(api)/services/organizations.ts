import useSWR from "swr";
import { apiClient } from "../client";
import type {
  Accountability,
  GroupListItem,
  GroupMembers,
  LocationDetail,
  LocationListItem,
  RolesLocation,
} from "../types";

type Id = string;

export type LocationPayload = {
  name: string;
  address: string;
  phoneNumber: string;
  roles: string[];
};

export type GroupPayload = {
  name: string;
  description?: string;
  type: "GROUP" | "MINISTRY";
  parentId: string;
  leaderIds: string[];
  memberIds: string[];
};

// Churches ("organizations"), their locations (sedes) and groups/ministries.

// Pass `undefined` to skip the request (e.g. until the user is known).
export const useOrganization = <T = LocationDetail>(id: Id | undefined) =>
  useSWR<T>(id ? `/organizations/${id}` : null);

export const useLocations = (organizationId: Id | undefined) =>
  useSWR<LocationListItem[]>(
    organizationId ? `/organizations/${organizationId}/childs` : null,
  );

export const useGroups = (locId: Id) =>
  useSWR<GroupListItem[]>(`/organizations/${locId}/childs`);

export const useGroupMembers = (groupId: Id) =>
  useSWR<GroupMembers>(`/organizations/locations/childs/${groupId}/members`);

export const useLocationRoles = (locId: Id) =>
  useSWR<RolesLocation[]>(`/organizations/locations/${locId}/roles`);

export const usePredefinedRoles = () =>
  useSWR<RolesLocation[]>("/organizations/locations/predefined-roles");

export const useMemberStates = (locId: Id) =>
  useSWR<Accountability[]>(`/organizations/${locId}/member-state`);

export const createOrganization = (payload: {
  name: string;
  userId?: string;
}) => apiClient.post("/organizations", payload);

export const createLocation = (
  payload: LocationPayload & { parentId: string },
) => apiClient.post<{ id: string }>("/organizations/locations", payload);

export const updateLocation = (locId: Id, payload: LocationPayload) =>
  apiClient.put(`/organizations/locations/${locId}`, payload);

export const createGroup = (payload: GroupPayload) =>
  apiClient.post("/organizations/locations/childs", payload);

export const deleteOrganization = (id: Id) =>
  apiClient.delete(`/organizations/${id}`);
