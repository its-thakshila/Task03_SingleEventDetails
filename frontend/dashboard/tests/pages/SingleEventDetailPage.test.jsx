import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SingleEventDetailPage from "../../pages/SingleEventDetailPage.jsx";

const renderWithRouter = (path = "/events/123") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/events/:id" element={<SingleEventDetailPage />} />
        <Route path="/events/:id/feedback" element={<div>Feedback Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("SingleEventDetailPage", () => {
  afterEach(() => {
    delete global.fetch;
    if (navigator.share) {
      delete navigator.share;
    }
    if (navigator.clipboard) {
      delete navigator.clipboard;
    }
  });

  it("shows loading then not-found when event data missing", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: "Upcoming" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ interested: false }) });

    renderWithRouter();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Event not found/i)).toBeInTheDocument());
  });

  it("renders event details after successful fetch", async () => {
    const eventData = {
      event_title: "Tech Talk",
      description: "Cutting-edge innovations",
      location: "Auditorium",
      interested_count: 5,
      start_time: "2025-01-10T10:00:00.000Z",
      end_time: "2025-01-10T12:00:00.000Z",
      event_photos: [
        { photo_url: "https://cdn.test/first.jpg" },
        { photo_url: "https://cdn.test/second.jpg" },
      ],
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(eventData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: "Upcoming" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ interested: false }) });

    renderWithRouter();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /tech talk/i })).toBeInTheDocument()
    );

    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/events/123", expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/events/123/status", expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/interested/status/123",
      expect.any(Object)
    );

    expect(screen.getByText(/Auditorium/)).toBeInTheDocument();
    expect(screen.getByText(/5 People Interested/)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Previous image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next image/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Go to image/i })).toHaveLength(2);
  });

  it("displays error state when event fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });

    renderWithRouter();

    await waitFor(() =>
      expect(screen.getByText(/Error: Failed to fetch event/i)).toBeInTheDocument()
    );
  });

  it("shows placeholder when event lacks photos", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            event_title: "Math Lecture",
            description: "Pure math insights",
            location: "Room 101",
            interested_count: 2,
            start_time: "2025-08-01T09:00:00.000Z",
            end_time: "2025-08-01T10:00:00.000Z",
            event_photos: [],
          }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: "Upcoming" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ interested: false }) });

    renderWithRouter("/events/55");

    await waitFor(() => expect(screen.getByText(/Math Lecture/i)).toBeInTheDocument());
    expect(screen.getByText(/No Image Found/i)).toBeInTheDocument();
  });

  it("toggles description expansion", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            event_title: "Drama",
            description: "Dramatic event description",
            location: "Theatre",
            interested_count: 1,
            start_time: "2025-02-11T09:00:00.000Z",
            end_time: "2025-02-11T11:00:00.000Z",
            event_photos: [],
          }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: "Upcoming" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ interested: false }) });

    const user = userEvent.setup();
    renderWithRouter("/events/88");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /More/i })).toBeInTheDocument()
    );
    const toggle = screen.getByRole("button", { name: /More/i });
    await user.click(toggle);
    expect(toggle).toHaveTextContent(/Less/i);
    await user.click(toggle);
    expect(toggle).toHaveTextContent(/More/i);
  });

  it("toggles interested state and updates count", async () => {
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === "/api/events/42") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              event_title: "Robotics Fair",
              description: "Robotics exhibition",
              location: "Hall B",
              interested_count: 10,
              start_time: "2025-04-01T08:00:00.000Z",
              end_time: "2025-04-01T11:00:00.000Z",
              event_photos: [],
            }),
        });
      }
      if (url === "/api/events/42/status") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: "Ongoing" }) });
      }
      if (url === "/api/interested/status/42") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ interested: false }) });
      }
      if (url === "/api/interested" && options.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ interested_count: 11 }),
        });
      }
      throw new Error(`Unhandled fetch call: ${url}`);
    });

    global.fetch = fetchMock;

    renderWithRouter("/events/42");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Robotics Fair/i })).toBeInTheDocument()
    );

    const interestedButton = screen.getByRole("button", { name: /Interested/i });
    expect(interestedButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/10 People Interested/)).toBeInTheDocument();

  const user = userEvent.setup();
  await user.click(interestedButton);

    expect(interestedButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/11 People Interested/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/interested",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ event_id: 42 }),
      })
    );
  });

  it("uses Web Share API when available", async () => {
    const shareStub = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareStub,
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            event_title: "Science Expo",
            description: "Explore science",
            location: "Hall C",
            interested_count: 2,
            start_time: "2025-05-20T09:00:00.000Z",
            end_time: "2025-05-20T15:00:00.000Z",
            event_photos: [],
          }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: "Upcoming" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ interested: false }) });

    renderWithRouter("/events/77");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Science Expo/i })).toBeInTheDocument()
    );

    const shareButton = screen.getByRole("button", { name: /Share Event/i });
    const user = userEvent.setup();
    await user.click(shareButton);

    expect(shareStub).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Science Expo",
        text: expect.stringContaining("Science Expo"),
      })
    );
  });

});
