process.env.VERCEL = "1";
const request = require("supertest");
const app = require("../../index");
const supabase = require("../../db");

describe("Single Event Details API", () => {
  describe("GET /api/events/:id", () => {
    it("returns 400 for invalid id", async () => {
      const res = await request(app).get("/api/events/not-a-number");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("returns the event payload when found", async () => {
      const event = {
        event_id: 42,
        event_title: "Robotics Fair",
        description: "Explore the latest robots",
        location: "Hall B",
        start_time: "2025-04-01T08:00:00.000Z",
        end_time: "2025-04-01T11:00:00.000Z",
        interested_count: 12,
        event_photos: [{ photo_url: "https://cdn.test/photo.jpg" }],
      };

      supabase.__queueResponse({ data: [event], error: null });

      const res = await request(app).get("/api/events/42");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(event);
    });

    it("returns 404 when event is missing", async () => {
      supabase.__queueResponse({ data: [], error: null });

      const res = await request(app).get("/api/events/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it("returns 500 when Supabase fails", async () => {
      supabase.__queueResponse({ data: null, error: new Error("boom") });

      const res = await request(app).get("/api/events/50");

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to fetch event/i);
    });
  });

  describe("GET /api/events/:id/status", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("computes an upcoming status", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-01-01T12:00:00.000Z"));

      supabase.__queueResponse({
        data: [
          {
            start_time: "2025-01-05T10:00:00.000Z",
            end_time: "2025-01-05T12:00:00.000Z",
          },
        ],
        error: null,
      });

      const res = await request(app).get("/api/events/10/status");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ event_id: 10, status: "Upcoming" });
    });
  });

  describe("GET /api/interested/status/:event_id", () => {
    it("reports interested=true when record exists", async () => {
      supabase.__queueResponse({ data: [{ event_id: 77 }], error: null });

      const res = await request(app)
        .get("/api/interested/status/77")
        .set("Cookie", "userId=test-user");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ event_id: 77, interested: true });
    });
  });

  describe("POST /api/interested", () => {
    it("creates a new interested record and increments count", async () => {
      supabase.__queueResponse({ data: [], error: null }); // existing check
      supabase.__queueResponse({ data: null, error: null }); // insert
      supabase.__queueResponse({ data: { interested_count: 3 }, error: null }); // fetch count
      supabase.__queueResponse({ data: null, error: null }); // update

      const res = await request(app)
        .post("/api/interested")
        .set("Cookie", "userId=test-user")
        .send({ event_id: 5 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        message: expect.stringContaining("marked as interested"),
        interested_count: 4,
      });
    });

    it("returns existing count when already interested", async () => {
      supabase.__queueResponse({ data: [{ event_id: 5 }], error: null }); // existing check
      supabase.__queueResponse({ data: { interested_count: 9 }, error: null }); // fetch count

      const res = await request(app)
        .post("/api/interested")
        .set("Cookie", "userId=test-user")
        .send({ event_id: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Already marked as interested",
        interested_count: 9,
      });
    });
  });

  describe("DELETE /api/interested", () => {
    it("removes interest and decrements count", async () => {
      supabase.__queueResponse({ data: null, error: null }); // delete
      supabase.__queueResponse({ data: { interested_count: 6 }, error: null }); // fetch current
      supabase.__queueResponse({ data: null, error: null }); // update

      const res = await request(app)
        .delete("/api/interested")
        .set("Cookie", "userId=test-user")
        .send({ event_id: 9 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Event removed from interested list",
        interested_count: 5,
      });
    });
  });

  describe("GET /api/events/:id/interested_counts", () => {
    it("returns the interested count for the event", async () => {
      supabase.__queueResponse({ data: { interested_count: 11 }, error: null });

      const res = await request(app).get("/api/events/11/interested_counts");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ event_id: 11, interested_count: 11 });
    });
  });
});
