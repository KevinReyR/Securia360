import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

describe("authenticated Data API client", () => {
  it("uses the verified user JWT instead of the publishable key", async () => {
    let authorization = "";
    const token = "verified-user-token";
    const supabase = createClient("https://example.supabase.co", "publishable-key", {
      accessToken: async () => token,
      global: {
        fetch: async (_input, init) => {
          authorization = new Headers(init?.headers).get("Authorization") ?? "";
          return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
        },
      },
    });

    await supabase.from("organizations").select("id");

    expect(authorization).toBe(`Bearer ${token}`);
  });
});
