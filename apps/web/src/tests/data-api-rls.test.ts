import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

const config = {
  url: process.env.SUPABASE_TEST_URL,
  key: process.env.SUPABASE_TEST_PUBLISHABLE_KEY,
  userAEmail: process.env.SUPABASE_TEST_USER_A_EMAIL,
  userAPassword: process.env.SUPABASE_TEST_USER_A_PASSWORD,
  userBEmail: process.env.SUPABASE_TEST_USER_B_EMAIL,
  userBPassword: process.env.SUPABASE_TEST_USER_B_PASSWORD,
  organizationA: process.env.SUPABASE_TEST_ORGANIZATION_A,
  organizationB: process.env.SUPABASE_TEST_ORGANIZATION_B,
};

const enabled = Object.values(config).every(Boolean);

describe.runIf(enabled)("Data API tenant isolation", () => {
  it("allows User A in Org A and denies Org B through real PostgREST", async () => {
    const userA = createClient<Database>(config.url!, config.key!, { auth: { persistSession: false } });
    const userB = createClient<Database>(config.url!, config.key!, { auth: { persistSession: false } });
    expect((await userA.auth.signInWithPassword({ email: config.userAEmail!, password: config.userAPassword! })).error).toBeNull();
    expect((await userB.auth.signInWithPassword({ email: config.userBEmail!, password: config.userBPassword! })).error).toBeNull();

    const [aOwn, aForeign, bOwn, bForeign] = await Promise.all([
      userA.from("organizations").select("id").eq("id", config.organizationA!),
      userA.from("organizations").select("id").eq("id", config.organizationB!),
      userB.from("organizations").select("id").eq("id", config.organizationB!),
      userB.from("organizations").select("id").eq("id", config.organizationA!),
    ]);
    expect(aOwn.data).toEqual([{ id: config.organizationA }]);
    expect(bOwn.data).toEqual([{ id: config.organizationB }]);
    expect(aForeign.data).toEqual([]);
    expect(bForeign.data).toEqual([]);

    const [aCanOwn, aCanForeign] = await Promise.all([
      userA.rpc("can", { p_organization_id: config.organizationA!, p_permission_code: "organization.read" }),
      userA.rpc("can", { p_organization_id: config.organizationB!, p_permission_code: "organization.read" }),
    ]);
    expect(aCanOwn).toMatchObject({ data: true, error: null });
    expect(aCanForeign).toMatchObject({ data: false, error: null });

    const deniedWrite = await userA.from("legal_entities").insert({ organization_id: config.organizationB!, legal_name: "Intento cruzado", tax_id: `RLS-${Date.now()}` });
    expect(deniedWrite.error).not.toBeNull();
    expect(deniedWrite.data).toBeNull();

    const workerRole = await userA.from("roles").select("id").eq("code", "worker").is("organization_id", null).single();
    expect(workerRole.error).toBeNull();
    const invitation = await userA.functions.invoke("invite-member", {
      body: {
        organizationId: config.organizationA!,
        email: config.userBEmail!,
        role_id: workerRole.data!.id,
        site_id: null,
      },
    });
    expect(invitation.error).toBeNull();
    expect((await userB.rpc("accept_my_invitations")).data).toBe(1);
    expect((await userB.from("organizations").select("id").eq("id", config.organizationA!)).data).toEqual([
      { id: config.organizationA },
    ]);
    expect((await userA.functions.invoke("invite-member", {
      body: {
        organizationId: config.organizationA!,
        email: config.userBEmail!,
        role_id: workerRole.data!.id,
        site_id: null,
      },
    })).error).toBeNull();
    expect((await userB.rpc("accept_my_invitations")).data).toBe(0);

    await Promise.all([userA.auth.signOut(), userB.auth.signOut()]);
  }, 15_000);
});
