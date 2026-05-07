import { describe, expect, it } from "vitest";
import {
  getOrigin,
  isValidApiKey,
  isValidHttpUrl,
  normalizeUrl,
} from "./validators";

describe("validators", () => {
  it("normalizes url by trimming and removing trailing slash", () => {
    expect(normalizeUrl("http://localhost:8989/")).toBe(
      "http://localhost:8989",
    );
  });

  it("validates http and https urls", () => {
    expect(isValidHttpUrl("http://localhost:8989")).toBe(true);
    expect(isValidHttpUrl("https://example.com")).toBe(true);
  });

  it("rejects invalid urls", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("not-a-url")).toBe(false);
  });

  it("validates api key length", () => {
    expect(isValidApiKey("short")).toBe(false);
    expect(isValidApiKey("longerkey")).toBe(true);
  });

  it("extracts origin from valid urls", () => {
    expect(getOrigin("http://localhost:8989/path")).toBe(
      "http://localhost:8989",
    );
    expect(getOrigin("not-a-url")).toBeNull();
  });
});
