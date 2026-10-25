export type CalendarLinks = {
  // https address of the .ics file, to paste in any calendar app.
  url: string;
  // webcal:// opens Apple Calendar (and Outlook) ready to subscribe.
  webcal: string;
  // Opens Google Calendar with the subscription to add.
  google: string;
};

// The API returns the path of the feed (/v1/public/calendar/<token>.ics); the
// calendar apps need the full address.
export const calendarLinks = (apiUrl: string, path: string): CalendarLinks => {
  const url = `${apiUrl.replace(/\/+$/, "")}${path}`;
  const webcal = url.replace(/^https?:\/\//, "webcal://");
  return {
    url,
    webcal,
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
  };
};
