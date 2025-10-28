import { describe, expect, it } from "vitest";
import { formatEventDate } from "../../pages/SingleEventDetailPage.jsx";

describe("formatEventDate", () => {
  it("formats ISO strings into readable text", () => {
    const formatted = formatEventDate("2025-03-15T14:30:00.000Z");
  expect(formatted).toMatch(/Sat|Sun|Mon|Tue|Wed|Thu|Fri/);
  expect(formatted).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
  expect(formatted).toMatch(/AM|PM/i);
  });

  it("returns fallback when date is missing", () => {
    expect(formatEventDate(null)).toBe("N/A");
    expect(formatEventDate(undefined)).toBe("N/A");
  });

  it("handles invalid date strings gracefully", () => {
    // toLocaleString on invalid date returns "Invalid Date" in most environments
    expect(formatEventDate("invalid-date")).toBe("Invalid Date");
  });
});
