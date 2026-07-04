function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  rrule?: string;
}

function buildEventLines(event: ICSEvent): string[] {
  const now = formatICSDate(new Date());
  const dtStart = formatICSDate(event.start);
  const dtEnd = formatICSDate(event.end);

  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.summary}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.location ? `LOCATION:${event.location.replace(/,/g, "\\,")}` : "",
    event.rrule ? `RRULE:${event.rrule}` : "",
    "END:VEVENT",
  ].filter(Boolean);
}

export function generateICS(event: ICSEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CareLink//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...buildEventLines(event),
    "END:VCALENDAR",
  ].join("\r\n");
}

export function generateICSBundle(events: ICSEvent[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CareLink//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap(buildEventLines),
    "END:VCALENDAR",
  ].join("\r\n");
}
