import { describe, it, expect, vi, afterEach } from "vitest";
import { GearIndigoApiClient, validateApiUrl } from "./api-client.js";

function mockResponse(status: number, body: unknown): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as Response;
}

const config = { apiUrl: "https://app.example.com", apiToken: "dg_secret" };

describe("validateApiUrl", () => {
  it("accepts https with any host", () => {
    expect(() => validateApiUrl("https://app.example.com")).not.toThrow();
  });

  it("accepts http only for loopback hosts", () => {
    expect(() => validateApiUrl("http://localhost:3000")).not.toThrow();
    expect(() => validateApiUrl("http://127.0.0.1:3000")).not.toThrow();
    expect(() => validateApiUrl("http://[::1]:3000")).not.toThrow();
  });

  it("rejects http for non-loopback hosts", () => {
    expect(() => validateApiUrl("http://example.com")).toThrow(/loopback/);
  });

  it("rejects userinfo and empty authority and bad schemes", () => {
    expect(() => validateApiUrl("https://user:pass@example.com")).toThrow(/userinfo/);
    expect(() => validateApiUrl("https:///path")).toThrow(/host is required/);
    expect(() => validateApiUrl("ftp://example.com")).toThrow(/scheme/);
  });
});

describe("GearIndigoApiClient.fromEnv", () => {
  const saved = { url: process.env.GIBIZ_API_URL, token: process.env.GIBIZ_API_TOKEN };
  afterEach(() => {
    process.env.GIBIZ_API_URL = saved.url;
    process.env.GIBIZ_API_TOKEN = saved.token;
  });

  it("requires GIBIZ_API_TOKEN", () => {
    delete process.env.GIBIZ_API_TOKEN;
    expect(() => GearIndigoApiClient.fromEnv()).toThrow(/GIBIZ_API_TOKEN/);
  });

  it("defaults GIBIZ_API_URL to the production host when unset", async () => {
    delete process.env.GIBIZ_API_URL;
    process.env.GIBIZ_API_TOKEN = "dg_x";
    const client = GearIndigoApiClient.fromEnv();
    const fetchFn = vi.fn().mockResolvedValue(mockResponse(200, { authMethod: "pat" }));
    // @ts-expect-error inject mock fetch for assertion
    client["fetchFn"] = fetchFn;
    await client.whoami();
    expect(new URL(fetchFn.mock.calls[0][0]).origin).toBe("https://biz.gearindigo.app");
  });
});

describe("GearIndigoApiClient", () => {
  it("constructor rejects an invalid URL", () => {
    expect(() => new GearIndigoApiClient({ apiUrl: "http://evil.com", apiToken: "dg_x" })).toThrow(
      /loopback/
    );
  });

  it("sends Bearer auth against /api/v1 and parses JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      mockResponse(200, { user: { id: "u", email: "e@x.com", name: "N" }, scopes: ["read"], authMethod: "pat" })
    );
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);

    const result = await client.whoami();
    expect(result.authMethod).toBe("pat");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://app.example.com/api/v1/whoami");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer dg_secret");
  });

  it("builds the project artifacts path with filters", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockResponse(200, { artifacts: [] }));
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);

    await client.listArtifacts({ projectId: "p1" }, { phase: "requirements", includeContent: true });
    const url = new URL(fetchFn.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/v1/projects/p1/artifacts");
    expect(url.searchParams.get("phase")).toBe("requirements");
    expect(url.searchParams.get("include")).toBe("content");
  });

  it("builds the codebase artifacts path", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockResponse(200, { artifacts: [] }));
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);

    await client.listArtifacts({ codebaseId: "c1" });
    expect(new URL(fetchFn.mock.calls[0][0]).pathname).toBe("/api/v1/codebases/c1/artifacts");
  });

  it("requires exactly one of projectId / codebaseId", async () => {
    const fetchFn = vi.fn();
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);

    await expect(client.listArtifacts({})).rejects.toThrow(/exactly one/);
    await expect(client.listArtifacts({ projectId: "p", codebaseId: "c" })).rejects.toThrow(
      /exactly one/
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("passes get-artifact summary/lines/metadata-only", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockResponse(200, { id: "a1" }));
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);

    await client.getArtifact({ projectId: "p1" }, "a1", { summary: true, lines: 100 });
    const url = new URL(fetchFn.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/v1/projects/p1/artifacts/a1");
    expect(url.searchParams.get("summary")).toBe("true");
    expect(url.searchParams.get("lines")).toBe("100");
  });

  it.each([
    [401, /Authentication failed/],
    [403, /Permission denied/],
    [404, /Resource not found/],
    [429, /Too many requests/],
    [500, /Server error \(HTTP 500\)/],
  ])("maps HTTP %i to a helpful error", async (status, pattern) => {
    const fetchFn = vi.fn().mockResolvedValue(mockResponse(status, { error: "x" }));
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);
    await expect(client.whoami()).rejects.toThrow(pattern);
  });

  it("wraps network failures", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const client = new GearIndigoApiClient(config, fetchFn as unknown as typeof fetch);
    await expect(client.whoami()).rejects.toThrow(/Connection failed/);
  });
});
