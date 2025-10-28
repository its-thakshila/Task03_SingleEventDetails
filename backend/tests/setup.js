const path = require("path");
const dotenvPath = path.resolve(__dirname, "..", ".env.test");
require("dotenv").config({ path: dotenvPath });

const responseQueue = [];

const createQueryBuilder = () => {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => builder),
    maybeSingle: jest.fn(() => builder),
    in: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    update: jest.fn(() => builder),
    then: (onFulfilled, onRejected) => {
      const next = responseQueue.length
        ? responseQueue.shift()
        : { data: [], error: null, count: null };
      return Promise.resolve(next).then(onFulfilled, onRejected);
    },
  };
  return builder;
};

const mockSupabase = {
  from: jest.fn(() => createQueryBuilder()),
  __queueResponse: (response) => {
    responseQueue.push(response);
  },
  __reset: () => {
    responseQueue.length = 0;
    mockSupabase.from.mockReset();
    mockSupabase.from.mockImplementation(() => createQueryBuilder());
  },
};

mockSupabase.from.mockImplementation(() => createQueryBuilder());

jest.mock("../db", () => mockSupabase);

beforeEach(() => {
  mockSupabase.__reset();
});

global.__supabaseMock = mockSupabase;

if (typeof global.fetch === "function") {
  jest.spyOn(global, "fetch").mockImplementation(() => {
    throw new Error("fetch should not be called during backend tests");
  });
}
