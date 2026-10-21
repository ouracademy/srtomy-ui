import type { EventInput } from "@fullcalendar/core";
import useSWR from "swr";
import { apiClient } from "../client";
import type { DeleteEventOption, EventAttendance, EventDetail } from "../types";

type Id = number | string;

export type EventPayload = {
  name: string;
  address?: string;
  organizationId: number;
  startTime: string;
  endTime: string;
  endRecur?: Date | null;
  speakerIds: number[];
  description?: string;
  daysOfWeek: number[];
  isACourse: boolean;
};

export const useEvent = (id: Id) => useSWR<EventDetail>(`/events/${id}`);

export const useEventAttendance = (id: Id) =>
  useSWR<EventAttendance>(`/events/${id}/attendance`);

// Not a SWR hook: FullCalendar asks for events itself on every range change.
export const fetchEvents = (params: {
  organizationId: number;
  start: Date;
  end: Date;
}) =>
  apiClient
    .get<EventInput[]>("/events", { params })
    .then((response) => response.data);

export const createEvent = (payload: EventPayload) =>
  apiClient.post("/events", payload);

export const deleteEvent = (id: Id, option: DeleteEventOption) =>
  apiClient.delete(`/events/${id}`, { data: { option } });

export const saveAttendance = (id: Id, personIds: number[]) =>
  apiClient.put(`/events/${id}/attendance`, { personIds });
