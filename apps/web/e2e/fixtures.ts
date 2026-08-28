import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TestUser = { id: string; email: string; password: string };

export type E2EFixture = {
  runId: string;
  organizationA: string;
  organizationB: string;
  organizationAName: string;
  organizationBName: string;
  siteA: string;
  improvementGapA: string;
  improvementGapTitle: string;
  siteManagerRole: string;
  userA: TestUser;
  userB: TestUser;
  switcher: TestUser;
  member: TestUser;
  deleteUserByEmail: (email: string) => Promise<void>;
  cleanup: () => Promise<void>;
};

function required(name: "SUPABASE_TEST_URL" | "SUPABASE_TEST_PUBLISHABLE_KEY" | "SUPABASE_TEST_SERVICE_ROLE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} for E2E tests.`);
  return value;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : JSON.stringify(error);
}

function assertNoError(result: { error: unknown }, action: string) {
  if (result.error) throw new Error(`${action}: ${message(result.error)}`);
}

export async function createE2EFixture(): Promise<E2EFixture> {
  const url = required("SUPABASE_TEST_URL");
  const serviceRoleKey = required("SUPABASE_TEST_SERVICE_ROLE_KEY");
  required("SUPABASE_TEST_PUBLISHABLE_KEY");

  const admin = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const runId = crypto.randomUUID();
  const prefix = `e2e-${runId.slice(0, 8)}`;
  const password = `Securia360-${runId}-A9!`;
  const createdUserIds: string[] = [];
  const organizationIds: string[] = [];

  const createUser = async (name: string): Promise<TestUser> => {
    const email = `${prefix}-${name}@example.invalid`;
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: `E2E ${name}`, last_name: "Fixture" },
    });
    assertNoError(result, `create ${name}`);
    const user = result.data.user;
    if (!user) throw new Error(`No user returned for ${name}.`);
    createdUserIds.push(user.id);
    return { id: user.id, email, password };
  };

  const userA = await createUser("admin-a");
  const userB = await createUser("admin-b");
  const switcher = await createUser("switcher");
  const member = await createUser("member");

  const organizationAName = `E2E Organización A ${prefix}`;
  const organizationBName = `E2E Organización B ${prefix}`;
  const organizations = await admin.from("organizations").insert([
    { name: organizationAName, slug: `${prefix}-a`, nit: `E2E-A-${runId}`, created_by: userA.id, updated_by: userA.id },
    { name: organizationBName, slug: `${prefix}-b`, nit: `E2E-B-${runId}`, created_by: userB.id, updated_by: userB.id },
  ]).select("id,slug");
  assertNoError(organizations, "create organizations");
  const organizationA = organizations.data?.find((item) => item.slug === `${prefix}-a`)?.id;
  const organizationB = organizations.data?.find((item) => item.slug === `${prefix}-b`)?.id;
  if (!organizationA || !organizationB) throw new Error("E2E organizations were not created.");
  organizationIds.push(organizationA, organizationB);

  const roleResult = await admin.from("roles").select("id,code").is("organization_id", null).in("code", ["organization_admin", "site_manager"]);
  assertNoError(roleResult, "read system roles");
  const adminRole = roleResult.data?.find((role) => role.code === "organization_admin")?.id;
  const siteManagerRole = roleResult.data?.find((role) => role.code === "site_manager")?.id;
  if (!adminRole || !siteManagerRole) throw new Error("Required system roles are missing.");

  const addMember = async (organizationId: string, user: TestUser) => {
    const result = await admin.from("organization_members").insert({
      organization_id: organizationId,
      user_id: user.id,
      status: "active",
      joined_at: new Date().toISOString(),
    }).select("id").single();
    assertNoError(result, `add ${user.email} to organization`);
    return result.data!.id;
  };
  const switcherA = await addMember(organizationA, switcher);
  const switcherB = await addMember(organizationB, switcher);
  await addMember(organizationA, member);
  const assignments = await admin.from("member_roles").insert([
    { organization_id: organizationA, organization_member_id: switcherA, role_id: adminRole, created_by: userA.id },
    { organization_id: organizationB, organization_member_id: switcherB, role_id: adminRole, created_by: userB.id },
  ]);
  assertNoError(assignments, "assign switcher roles");

  const entities = await admin.from("legal_entities").insert([
    { organization_id: organizationA, legal_name: `E2E Razón A ${prefix}`, tax_id: `E2E-LE-A-${runId}`, employee_count: 1, risk_class: 1 },
    { organization_id: organizationB, legal_name: `E2E Razón B ${prefix}`, tax_id: `E2E-LE-B-${runId}`, employee_count: 1, risk_class: 1 },
  ]).select("id,organization_id");
  assertNoError(entities, "create legal entities");
  const legalEntityA = entities.data?.find((item) => item.organization_id === organizationA)?.id;
  if (!legalEntityA) throw new Error("E2E legal entity A was not created.");
  const sites = await admin.from("sites").insert({
    organization_id: organizationA,
    legal_entity_id: legalEntityA,
    name: `E2E Sede A ${prefix}`,
    code: `E2E-${runId.slice(0, 8)}`,
  }).select("id").single();
  assertNoError(sites, "create site A");
  const siteA = sites.data!.id;

  const finding = await admin.from("improvement_findings").insert({
    organization_id: organizationA,
    title: `E2E Hallazgo ${prefix}`,
    description: "Hallazgo efímero para el flujo E2E.",
    created_by: userA.id,
  }).select("id").single();
  assertNoError(finding, "create E2E improvement finding");
  const improvementGapTitle = `E2E Brecha ${prefix}`;
  const gap = await admin.from("improvement_gaps").insert({
    organization_id: organizationA,
    origin_type: "finding",
    finding_id: finding.data!.id,
    deduplication_key: `e2e-gap:${prefix}`,
    title: improvementGapTitle,
    description: "Brecha efímera para validar el flujo completo.",
    priority: "high",
    created_by: userA.id,
  }).select("id").single();
  assertNoError(gap, "create E2E improvement gap");
  const improvementGapA = gap.data!.id;

  const deleteUserByEmail = async (email: string) => {
    for (let page = 1; page <= 20; page += 1) {
      const users = await admin.auth.admin.listUsers({ page, perPage: 1_000 });
      assertNoError(users, "list auth users");
      const user = users.data.users.find((candidate) => candidate.email === email);
      if (user) {
        const ownedOrganizations = await admin.from("organizations").select("id").eq("created_by", user.id);
        assertNoError(ownedOrganizations, `find organizations created by ${email}`);
        const ownedOrganizationIds = ownedOrganizations.data?.map((organization) => organization.id) ?? [];
        if (ownedOrganizationIds.length) {
          const deletedOrganizations = await admin.from("organizations").delete().in("id", ownedOrganizationIds);
          assertNoError(deletedOrganizations, `delete organizations created by ${email}`);
        }
        const deleted = await admin.auth.admin.deleteUser(user.id);
        assertNoError(deleted, `delete ${email}`);
        return;
      }
      if (users.data.users.length < 1_000) return;
    }
  };

  const cleanup = async () => {
    const versions = await admin.from("document_versions").select("bucket_id,storage_path").in("organization_id", organizationIds);
    if (!versions.error) {
      const byBucket = new Map<string, string[]>();
      for (const version of versions.data ?? []) {
        byBucket.set(version.bucket_id, [...(byBucket.get(version.bucket_id) ?? []), version.storage_path]);
      }
      await Promise.all([...byBucket.entries()].map(async ([bucket, paths]) => {
        const result = await admin.storage.from(bucket).remove(paths);
        if (result.error) throw new Error(`remove fixture storage: ${message(result.error)}`);
      }));
    }
    const deleteOrganizations = await admin.from("organizations").delete().in("id", organizationIds);
    assertNoError(deleteOrganizations, "delete E2E organizations");
    await Promise.all(createdUserIds.map(async (id) => {
      const deleted = await admin.auth.admin.deleteUser(id);
      assertNoError(deleted, `delete E2E user ${id}`);
    }));
  };

  return { runId, organizationA, organizationB, organizationAName, organizationBName, siteA, improvementGapA, improvementGapTitle, siteManagerRole, userA, userB, switcher, member, deleteUserByEmail, cleanup };
}
