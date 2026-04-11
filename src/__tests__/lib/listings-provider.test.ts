import { describe, it, expect } from "vitest";
import { IdxBrokerProvider } from "@/lib/listings/idx-broker";
import { ResoProvider } from "@/lib/listings/reso";

describe("IdxBrokerProvider", () => {
  const provider = new IdxBrokerProvider("test-key");

  it("search returns empty result", async () => {
    const result = await provider.search({ query: "test" });
    expect(result).toEqual({ listings: [], total: 0 });
  });

  it("getById returns null (placeholder)", async () => {
    const result = await provider.getById("123");
    expect(result).toBeNull();
  });

  it("getFeatured returns empty array", async () => {
    const result = await provider.getFeatured(6);
    expect(result).toEqual([]);
  });
});

describe("ResoProvider", () => {
  const provider = new ResoProvider("test-token", "https://api.example.com");

  it("search returns empty result", async () => {
    const result = await provider.search({});
    expect(result).toEqual({ listings: [], total: 0 });
  });

  it("getById returns null (placeholder)", async () => {
    const result = await provider.getById("abc");
    expect(result).toBeNull();
  });

  it("getFeatured returns empty array", async () => {
    const result = await provider.getFeatured();
    expect(result).toEqual([]);
  });

  it("implements the ListingProvider interface contract", () => {
    expect(typeof provider.search).toBe("function");
    expect(typeof provider.getById).toBe("function");
    expect(typeof provider.getFeatured).toBe("function");
  });
});
