import "@testing-library/jest-dom/vitest";

// Mock the fetch-based API helper to keep tests deterministic
vi.mock("../src/api", () => ({
  API: "",
  apiGet: vi.fn(() => Promise.resolve({})),
  apiJSON: vi.fn(() => Promise.resolve({})),
}));
