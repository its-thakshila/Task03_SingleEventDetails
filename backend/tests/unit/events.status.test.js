const router = require("../../routes/events.routes");

const { computeEventStatus } = router;

describe("computeEventStatus", () => {
  const start = "2025-01-10T10:00:00.000Z";
  const end = "2025-01-10T12:00:00.000Z";

  it("returns Upcoming when current time is before start", () => {
    const status = computeEventStatus(start, end, new Date("2025-01-09T09:00:00.000Z"));
    expect(status).toBe("Upcoming");
  });

  it("returns Ongoing between start and end", () => {
    const status = computeEventStatus(start, end, new Date("2025-01-10T11:00:00.000Z"));
    expect(status).toBe("Ongoing");
  });

  it("returns Ended after end time", () => {
    const status = computeEventStatus(start, end, new Date("2025-01-10T13:00:00.000Z"));
    expect(status).toBe("Ended");
  });

  it("defaults to Upcoming when dates are invalid", () => {
    const status = computeEventStatus("bad", "date", new Date("2025-01-10T13:00:00.000Z"));
    expect(status).toBe("Upcoming");
  });
});
