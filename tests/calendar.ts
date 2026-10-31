import type { Locator, Page } from "@playwright/test";

// The first time slot of the week in the events calendar. FullCalendar draws a
// table: a header row group, then the body, whose cells are the slots.
export const firstCalendarSlot = (page: Page): Locator =>
  page
    .getByRole("table")
    .getByRole("rowgroup")
    .nth(1)
    .getByRole("cell")
    .first();
