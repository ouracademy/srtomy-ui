import useSWR from "swr";
import { apiClient } from "../client";
import type { PersonResponse } from "../person";
import type { SpringPage } from "../pagination";
import type { RolesLocation } from "../types";

export type PeopleParams = {
  organizationId: string;
  page?: number;
  size?: number;
  searchText?: string;
};

export type PersonPayload = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  age?: number;
  birthdate: string | null;
  hasBeenBaptized: boolean;
  organizationId: string;
  roles: string[];
};

// `T` lets a screen ask for the shape it renders (e.g. the table rows).
export const usePeople = <T = PersonResponse>(params: PeopleParams) =>
  useSWR<SpringPage<T>>([
    "/people",
    { params: { ...params, searchText: params.searchText || undefined } },
  ]);

export const usePerson = (id: string) => useSWR(`/people/${id}`);

export const usePersonRoles = (locId: string, id: string) =>
  useSWR<RolesLocation[]>(
    `/organizations/locations/${locId}/person/${id}/roles`,
  );

export const createPerson = (payload: PersonPayload) =>
  apiClient.post("/people", payload);

export const updatePerson = (id: string, payload: PersonPayload) =>
  apiClient.put(`/people/${id}`, payload);
