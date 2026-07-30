import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashToken, readCookie, tokenHashMatches, tokenId } from "./token";
import { passwordSchema, registerSchema } from "@number-reseller/validation";

describe("authentication security primitives", () => {
  it("creates lookup-prefixed opaque tokens and stores only deterministic hashes", () => {
    const token = createOpaqueToken();
    expect(token.raw).not.toBe(token.hash);
    expect(tokenId(token.raw)).toBe(token.id);
    expect(tokenHashMatches(token.raw, token.hash)).toBe(true);
    expect(tokenHashMatches(`${token.id}.tampered`, token.hash)).toBe(false);
    expect(hashToken(token.raw)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reads exact cookie names without accepting prefixes", () => {
    expect(readCookie("nr_access=abc; nr_refresh=def", "nr_refresh")).toBe("def");
    expect(readCookie("other_nr_refresh=bad", "nr_refresh")).toBeUndefined();
  });

  it("enforces strong passwords and explicit policy acceptance", () => {
    expect(passwordSchema.safeParse("weakpassword").success).toBe(false);
    expect(passwordSchema.safeParse("GoodPassword1!").success).toBe(true);
    expect(
      registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "GoodPassword1!",
        termsAccepted: false
      }).success,
    ).toBe(false);
  });
});
