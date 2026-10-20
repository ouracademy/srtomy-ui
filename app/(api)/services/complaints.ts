import { apiClient } from "../client";

export type ComplaintPayload = {
  firstName: string;
  lastName: string;
  dni: string;
  address: string;
  email: string;
  comment: string;
};

export const sendComplaint = (payload: ComplaintPayload) =>
  apiClient.post("/complaints", payload);
