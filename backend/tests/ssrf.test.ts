import { describe, expect, it } from "vitest";
import { assertSafeProviderUrl, isPrivateIp } from "../src/utils/ssrf.js";

describe("isPrivateIp", () => {
  it("flags private IPv4 ranges", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("100.64.0.1")).toBe(true); // CGNAT
  });

  it("allows public IPv4 addresses", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("104.16.0.1")).toBe(false);
  });

  it("flags private IPv6 addresses and IPv4-mapped private addresses", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("fd00::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("::ffff:192.168.0.1")).toBe(true);
    expect(isPrivateIp("2001:db8::1")).toBe(true);
  });
});

describe("assertSafeProviderUrl", () => {
  it("rejects non-HTTPS protocols", async () => {
    await expect(assertSafeProviderUrl("http://example.com/otp")).rejects.toThrow(
      "must use HTTPS"
    );
  });

  it("rejects URLs with embedded credentials", async () => {
    await expect(
      assertSafeProviderUrl("https://user:pass@example.com/otp")
    ).rejects.toThrow("must not contain credentials");
  });

  it("rejects malformed URLs", async () => {
    await expect(assertSafeProviderUrl("not a url")).rejects.toThrow(
      "Invalid provider endpoint URL"
    );
  });

  it("rejects hosts that resolve to private addresses", async () => {
    await expect(assertSafeProviderUrl("https://localhost/otp")).rejects.toThrow(
      "private address"
    );
    await expect(
      assertSafeProviderUrl("https://169.254.169.254/latest/meta-data")
    ).rejects.toThrow("private address");
    await expect(assertSafeProviderUrl("https://192.168.0.1/otp")).rejects.toThrow(
      "private address"
    );
  });

  it("accepts a public literal IP", async () => {
    await expect(assertSafeProviderUrl("https://8.8.8.8/otp")).resolves.toBe(
      "https://8.8.8.8/otp"
    );
  });

  it("accepts a resolvable public HTTPS host", async () => {
    await expect(
      assertSafeProviderUrl("https://api.durianrcs.com/otp")
    ).resolves.toContain("https://api.durianrcs.com/");
  });
});