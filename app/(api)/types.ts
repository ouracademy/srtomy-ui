// Shapes of the srtomy-api responses used by the UI. One place, so services
// and components do not import types from each other's pages.
import type { PersonResponse } from "./person";

export type LocationDetail = {
  name: string;
  address: string;
  phoneNumber: string;
};

export type LocationListItem = {
  id: number;
  name: string;
};

export type GroupListItem = {
  id: number;
  name: string;
  type: "GROUP" | "MINISTRY";
};

export type GroupMembers = {
  LEADER: PersonResponse[];
  IS_PART_OF: PersonResponse[];
};

export type RolesLocation = {
  id: number;
  name: string;
  isPredefined: boolean;
};

export type PersonListItem = {
  id: number;
  name: string;
};

export type Accountability = {
  child: PersonResponse;
  type: string;
};

export type EventDetail = {
  id: number;
  title: string;
  daysOfWeek: number[];
  start: Date;
  end: Date;
  isACourse: boolean;
  address: string;
  description: string;
  speakers: PersonResponse[];
  endRecur?: Date;
  recurrentEvent?: EventDetail;
};

export type EventAttendance = {
  numberOfVisitors: number;
  visitorsDescription: string;
  personIds: number[];
};

export type DeleteEventOption =
  "THIS_EVENT" | "THIS_AND_THE_FOLLOWING_EVENTS" | "ALL_EVENTS";
