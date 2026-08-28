import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

const config = {
  url: process.env.SUPABASE_TEST_URL,
  publishableKey: process.env.SUPABASE_TEST_PUBLISHABLE_KEY,
  serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
};

const enabled = Object.values(config).every(Boolean);
const runId = crypto.randomUUID();
const password = `Securia360-${crypto.randomUUID()}-A9!`;
const prefix = `ci-rls-${runId}`;

type Fixture = {
  organizationA: string;
  organizationB: string;
  siteA: string;
  siteB: string;
  memberA: string;
  userAId: string;
  userBId: string;
  userCId: string;
  userAEmail: string;
  userBEmail: string;
  documentPath: string;
  adminRole: string;
  siteManagerRole: string;
};

let admin: ReturnType<typeof createClient<Database>>;
let fixture: Fixture;

function newPublicClient() {
  return createClient<Database>(config.url!, config.publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertNoError(result: { error: { message: string } | null }, action: string) {
  expect(result.error, action).toBeNull();
}

describe.runIf(enabled)("Data API tenant isolation", () => {
  beforeAll(async () => {
    admin = createClient<Database>(config.url!, config.serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [userA, userB, userC] = await Promise.all(
      ["a", "b", "c"].map(async (suffix) => {
        const result = await admin.auth.admin.createUser({
          email: `${prefix}-${suffix}@example.invalid`,
          password,
          email_confirm: true,
        });
        await assertNoError(result, `create User ${suffix.toUpperCase()}`);
        return result.data.user!;
      }),
    );

    const organizations = await admin.from("organizations").insert([
      { name: `CI Org A ${runId}`, slug: `${prefix}-a`, nit: `CI-A-${runId}`, created_by: userA.id, updated_by: userA.id },
      { name: `CI Org B ${runId}`, slug: `${prefix}-b`, nit: `CI-B-${runId}`, created_by: userB.id, updated_by: userB.id },
    ]).select("id, slug");
    await assertNoError(organizations, "create organizations");
    const organizationA = organizations.data!.find((organization) => organization.slug === `${prefix}-a`)!.id;
    const organizationB = organizations.data!.find((organization) => organization.slug === `${prefix}-b`)!.id;

    const roleResult = await admin.from("roles").select("id, code").is("organization_id", null).in("code", ["organization_admin", "site_manager"]);
    await assertNoError(roleResult, "read system roles");
    const adminRole = roleResult.data!.find((role) => role.code === "organization_admin")!.id;
    const siteManagerRole = roleResult.data!.find((role) => role.code === "site_manager")!.id;

    // The organization bootstrap trigger creates an active administrator membership
    // for each creator. Only User C needs an explicit membership in Org A.
    const createMemberC = await admin.from("organization_members").insert({
      organization_id: organizationA,
      user_id: userC.id,
      status: "active",
      joined_at: new Date().toISOString(),
    });
    await assertNoError(createMemberC, "create User C membership");
    const memberships = await admin.from("organization_members")
      .select("id, organization_id, user_id")
      .in("organization_id", [organizationA, organizationB]);
    await assertNoError(memberships, "read memberships");
    const memberA = memberships.data!.find((member) => member.organization_id === organizationA && member.user_id === userA.id)!;
    const memberC = memberships.data!.find((member) => member.organization_id === organizationA && member.user_id === userC.id)!;
    const assignUserCRole = await admin.from("member_roles").insert({
      organization_id: organizationA,
      organization_member_id: memberC.id,
      role_id: adminRole,
      created_by: userC.id,
    });
    await assertNoError(assignUserCRole, "assign User C administrator role");

    const legalEntities = await admin.from("legal_entities").insert([
      { organization_id: organizationA, legal_name: `CI Legal A ${runId}`, tax_id: `CI-LE-A-${runId}` },
      { organization_id: organizationB, legal_name: `CI Legal B ${runId}`, tax_id: `CI-LE-B-${runId}` },
    ]).select("id, organization_id");
    await assertNoError(legalEntities, "create legal entities");
    const legalEntityA = legalEntities.data!.find((entity) => entity.organization_id === organizationA)!.id;
    const sites = await admin.from("sites").insert([
      { organization_id: organizationA, legal_entity_id: legalEntityA, name: `CI Site A ${runId}`, code: `A-${runId.slice(0, 8)}` },
      { organization_id: organizationA, legal_entity_id: legalEntityA, name: `CI Site B ${runId}`, code: `B-${runId.slice(0, 8)}` },
    ]).select("id, code");
    await assertNoError(sites, "create sites");
    fixture = {
      organizationA,
      organizationB,
      siteA: sites.data!.find((site) => site.code.startsWith("A-"))!.id,
      siteB: sites.data!.find((site) => site.code.startsWith("B-"))!.id,
      memberA: memberA.id,
      userAId: userA.id,
      userBId: userB.id,
      userCId: userC.id,
      userAEmail: userA.email!,
      userBEmail: userB.email!,
      documentPath: `${organizationA}/documents/${crypto.randomUUID()}/${crypto.randomUUID()}/fixture.pdf`,
      adminRole,
      siteManagerRole,
    };
  }, 30_000);

  afterAll(async () => {
    if (!admin || !fixture) return;
    await admin.storage.from("organization-documents").remove([fixture.documentPath]);
    await admin.from("organizations").delete().in("id", [fixture.organizationA, fixture.organizationB]);
    await Promise.all([fixture.userAId, fixture.userBId, fixture.userCId].map((id) => admin.auth.admin.deleteUser(id)));
  }, 30_000);

  it("allows User A in Org A and denies Org B through real PostgREST", async () => {
    const userA = newPublicClient();
    const userB = newPublicClient();
    await assertNoError(await userA.auth.signInWithPassword({ email: fixture.userAEmail, password }), "sign in User A");
    await assertNoError(await userB.auth.signInWithPassword({ email: fixture.userBEmail, password }), "sign in User B");

    const [aOwn, aForeign, bOwn, bForeign] = await Promise.all([
      userA.from("organizations").select("id").eq("id", fixture.organizationA),
      userA.from("organizations").select("id").eq("id", fixture.organizationB),
      userB.from("organizations").select("id").eq("id", fixture.organizationB),
      userB.from("organizations").select("id").eq("id", fixture.organizationA),
    ]);
    expect(aOwn.data).toEqual([{ id: fixture.organizationA }]);
    expect(bOwn.data).toEqual([{ id: fixture.organizationB }]);
    expect(aForeign.data).toEqual([]);
    expect(bForeign.data).toEqual([]);

    const [aCanOwn, aCanForeign] = await Promise.all([
      userA.rpc("can", { p_organization_id: fixture.organizationA, p_permission_code: "organization.read" }),
      userA.rpc("can", { p_organization_id: fixture.organizationB, p_permission_code: "organization.read" }),
    ]);
    expect(aCanOwn).toMatchObject({ data: true, error: null });
    expect(aCanForeign).toMatchObject({ data: false, error: null });

    const allowedWrite = await userA.from("legal_entities").insert({ organization_id: fixture.organizationA, legal_name: `Permitido ${runId}`, tax_id: `CI-OK-${runId}` }).select("id");
    expect(allowedWrite.error).toBeNull();
    expect(allowedWrite.data).toHaveLength(1);
    const deniedWrite = await userA.from("legal_entities").insert({ organization_id: fixture.organizationB, legal_name: "Intento cruzado", tax_id: `CI-DENY-${runId}` }).select("id");
    expect(deniedWrite.error).not.toBeNull();
    expect(deniedWrite.data ?? []).toEqual([]);

    const allowedUpdate = await userA.from("sites").update({ name: `CI Site A updated ${runId}` }).eq("id", fixture.siteA).select("id");
    expect(allowedUpdate.error).toBeNull();
    expect(allowedUpdate.data).toEqual([{ id: fixture.siteA }]);
    const deniedUpdate = await userA.from("sites").update({ name: "cross-tenant update" }).eq("organization_id", fixture.organizationB).select("id");
    expect(deniedUpdate.data ?? []).toEqual([]);

    await Promise.all([userA.auth.signOut(), userB.auth.signOut()]);
  }, 30_000);

  it("revokes access from a suspended member and enforces site scope", async () => {
    const userA = newPublicClient();
    await assertNoError(await userA.auth.signInWithPassword({ email: fixture.userAEmail, password }), "sign in User A");
    await assertNoError(await admin.from("organization_members").update({ status: "suspended" }).eq("id", fixture.memberA), "suspend User A");
    expect(await userA.rpc("can", { p_organization_id: fixture.organizationA, p_permission_code: "organization.read" })).toMatchObject({ data: false, error: null });
    expect((await userA.from("organizations").select("id").eq("id", fixture.organizationA)).data).toEqual([]);

    await assertNoError(await admin.from("organization_members").update({ status: "active" }).eq("id", fixture.memberA), "restore User A");
    const memberships = await admin.from("member_roles").delete().eq("organization_member_id", fixture.memberA);
    await assertNoError(memberships, "remove global role from User A");
    await assertNoError(await admin.from("member_roles").insert({ organization_id: fixture.organizationA, organization_member_id: fixture.memberA, role_id: fixture.siteManagerRole, site_id: fixture.siteA, created_by: fixture.userAId }), "assign site scope");

    expect(await userA.rpc("can", { p_organization_id: fixture.organizationA, p_permission_code: "sites.update", p_site_id: fixture.siteA })).toMatchObject({ data: true, error: null });
    expect(await userA.rpc("can", { p_organization_id: fixture.organizationA, p_permission_code: "sites.update", p_site_id: fixture.siteB })).toMatchObject({ data: false, error: null });
    expect((await userA.from("sites").update({ name: `Scoped ${runId}` }).eq("id", fixture.siteA).select("id")).data).toEqual([{ id: fixture.siteA }]);
    expect((await userA.from("sites").update({ name: "Must fail" }).eq("id", fixture.siteB).select("id")).data ?? []).toEqual([]);

    await assertNoError(await admin.from("member_roles").insert({ organization_id: fixture.organizationA, organization_member_id: fixture.memberA, role_id: fixture.adminRole, created_by: fixture.userAId }), "restore global role for document test");

    await userA.auth.signOut();
  }, 30_000);

  it("keeps improvement actions, evidence, validation, and gap closure inside the tenant", async () => {
    const userA = newPublicClient();
    const userB = newPublicClient();
    await assertNoError(await userA.auth.signInWithPassword({ email: fixture.userAEmail, password }), "sign in User A");
    await assertNoError(await userB.auth.signInWithPassword({ email: fixture.userBEmail, password }), "sign in User B");

    const finding = await userA.from("improvement_findings").insert({ organization_id: fixture.organizationA, title: `CI Finding ${runId}` }).select("id").single();
    expect(finding.error).toBeNull();
    const gap = await userA.from("improvement_gaps").insert({ organization_id: fixture.organizationA, origin_type: "finding", finding_id: finding.data!.id, deduplication_key: `ci-gap:${runId}`, title: `CI Gap ${runId}`, priority: "high" }).select("id").single();
    expect(gap.error).toBeNull();
    const action = await userA.from("improvement_actions").insert({ organization_id: fixture.organizationA, gap_id: gap.data!.id, title: `CI Action ${runId}`, priority: "high" }).select("id").single();
    expect(action.error).toBeNull();
    expect((await userB.from("improvement_actions").select("id").eq("id", action.data!.id)).data).toEqual([]);
    expect((await userB.from("improvement_actions").update({ title: "cross-tenant" }).eq("id", action.data!.id).select("id")).data ?? []).toEqual([]);

    const documentA = await userA.from("documents").insert({ organization_id: fixture.organizationA, entity_type: "improvement_action", entity_id: action.data!.id, title: `CI Evidence A ${runId}` }).select("id").single();
    expect(documentA.error).toBeNull();
    const versionA = await userA.from("document_versions").insert({ organization_id: fixture.organizationA, document_id: documentA.data!.id, version_number: 1, bucket_id: "evidences", storage_path: `${fixture.organizationA}/improvement_action/${action.data!.id}/${documentA.data!.id}/fixture.pdf`, original_name: "fixture.pdf", mime_type: "application/pdf", size_bytes: 1, uploaded_by: fixture.userAId }).select("id").single();
    expect(versionA.error).toBeNull();
    expect((await userA.from("improvement_actions").update({ evidence_document_version_id: versionA.data!.id, status: "evidence_submitted" }).eq("id", action.data!.id).select("id,status")).data).toEqual([{ id: action.data!.id, status: "evidence_submitted" }]);

    const documentB = await admin.from("documents").insert({ organization_id: fixture.organizationB, entity_type: "organization", entity_id: fixture.organizationB, title: `CI Evidence B ${runId}` }).select("id").single();
    await assertNoError(documentB, "create foreign evidence document");
    const versionB = await admin.from("document_versions").insert({ organization_id: fixture.organizationB, document_id: documentB.data!.id, version_number: 1, bucket_id: "evidences", storage_path: `${fixture.organizationB}/organization/${fixture.organizationB}/${documentB.data!.id}/foreign.pdf`, original_name: "foreign.pdf", mime_type: "application/pdf", size_bytes: 1, uploaded_by: fixture.userBId }).select("id").single();
    await assertNoError(versionB, "create foreign evidence version");
    expect((await userA.from("improvement_actions").update({ evidence_document_version_id: versionB.data!.id }).eq("id", action.data!.id)).error).not.toBeNull();

    await assertNoError(await admin.from("member_roles").delete().eq("organization_member_id", fixture.memberA), "remove improvement validator role");
    await assertNoError(await admin.from("member_roles").insert({ organization_id: fixture.organizationA, organization_member_id: fixture.memberA, role_id: fixture.siteManagerRole, site_id: fixture.siteA, created_by: fixture.userAId }), "assign non-validator site role");
    expect((await userA.from("improvement_actions").update({ status: "verified", validation_note: "not allowed" }).eq("id", action.data!.id)).error).not.toBeNull();
    await assertNoError(await admin.from("member_roles").delete().eq("organization_member_id", fixture.memberA), "remove non-validator role");
    await assertNoError(await admin.from("member_roles").insert({ organization_id: fixture.organizationA, organization_member_id: fixture.memberA, role_id: fixture.adminRole, created_by: fixture.userAId }), "restore improvement validator role");
    expect((await userA.from("improvement_actions").update({ status: "verified", validation_note: "Evidence is sufficient" }).eq("id", action.data!.id).select("id,status")).data).toEqual([{ id: action.data!.id, status: "verified" }]);
    expect((await userA.from("improvement_gaps").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: fixture.userAId }).eq("id", gap.data!.id).select("id,status")).data).toEqual([{ id: gap.data!.id, status: "resolved" }]);

    await Promise.all([userA.auth.signOut(), userB.auth.signOut()]);
  }, 30_000);

  it("keeps private Storage and signed downloads inside the tenant", async () => {
    const userA = newPublicClient();
    const userB = newPublicClient();
    await assertNoError(await userA.auth.signInWithPassword({ email: fixture.userAEmail, password }), "sign in User A");
    await assertNoError(await userB.auth.signInWithPassword({ email: fixture.userBEmail, password }), "sign in User B");
    const upload = await userA.storage.from("organization-documents").upload(fixture.documentPath, new Blob(["integration fixture"], { type: "application/pdf" }), { contentType: "application/pdf", upsert: false });
    await assertNoError(upload, "upload private document as User A");
    const signed = await userA.storage.from("organization-documents").createSignedUrl(fixture.documentPath, 30);
    await assertNoError(signed, "create signed URL as User A");
    expect((await fetch(signed.data!.signedUrl)).ok).toBe(true);
    expect((await userB.storage.from("organization-documents").download(fixture.documentPath)).error).not.toBeNull();
    expect((await userB.storage.from("organization-documents").createSignedUrl(fixture.documentPath, 30)).error).not.toBeNull();
    expect((await userB.storage.from("organization-documents").upload(fixture.documentPath, new Blob(["forbidden"], { type: "application/pdf" }), { contentType: "application/pdf", upsert: false })).error).not.toBeNull();
    await Promise.all([userA.auth.signOut(), userB.auth.signOut()]);
  }, 30_000);

  it("keeps PPE stock atomic and denies PPE records across tenants", async () => {
    const userA = newPublicClient(); const userB = newPublicClient();
    await assertNoError(await userA.auth.signInWithPassword({ email: fixture.userAEmail, password }), "sign in PPE User A");
    await assertNoError(await userB.auth.signInWithPassword({ email: fixture.userBEmail, password }), "sign in PPE User B");
    const catalog = await userA.from("ppe_catalog").insert({ organization_id: fixture.organizationA, code: `CI-PPE-${runId.slice(0, 8)}`, name: "CI helmet", category: "head", useful_life_days: 30 }).select("id").single();
    expect(catalog.error).toBeNull();
    const inventory = await userA.rpc("create_ppe_inventory", { p_organization_id: fixture.organizationA, p_site_id: fixture.siteA, p_ppe_catalog_id: catalog.data!.id, p_size_label: "M", p_reorder_point: 1 });
    expect(inventory.error).toBeNull();
    expect((await userA.rpc("record_ppe_inventory_movement", { p_inventory_id: inventory.data!, p_movement_type: "purchase", p_quantity: 1, p_note: "fixture", p_evidence_document_version_id: undefined })).error).toBeNull();
    const assignment = await userA.from("ppe_assignments").insert({ organization_id: fixture.organizationA, organization_member_id: fixture.memberA, site_id: fixture.siteA, ppe_catalog_id: catalog.data!.id, size_label: "M", created_by: fixture.userAId }).select("id").single();
    expect(assignment.error).toBeNull();
    const [first, second] = await Promise.all([
      userA.rpc("deliver_ppe", { p_assignment_id: assignment.data!.id, p_inventory_id: inventory.data!, p_quantity: 1, p_evidence_document_version_id: undefined, p_delivery_kind: "initial" }),
      userA.rpc("deliver_ppe", { p_assignment_id: assignment.data!.id, p_inventory_id: inventory.data!, p_quantity: 1, p_evidence_document_version_id: undefined, p_delivery_kind: "replacement" }),
    ]);
    expect([first.error, second.error].filter(Boolean)).toHaveLength(1);
    const deliveryId = (first.data ?? second.data)!;
    expect((await userA.from("ppe_inventory").select("quantity_on_hand").eq("id", inventory.data!).single()).data?.quantity_on_hand).toBe(0);
    expect((await userA.rpc("accept_ppe_delivery", { p_delivery_id: deliveryId })).error).toBeNull();
    expect((await userB.from("ppe_inventory").select("id").eq("id", inventory.data!)).data).toEqual([]);
    expect((await userB.from("ppe_assignments").select("id").eq("id", assignment.data!.id)).data).toEqual([]);
    expect((await userB.rpc("record_ppe_inventory_movement", { p_inventory_id: inventory.data!, p_movement_type: "purchase", p_quantity: 1, p_note: "cross tenant", p_evidence_document_version_id: undefined })).error).not.toBeNull();
    await Promise.all([userA.auth.signOut(), userB.auth.signOut()]);
  }, 30_000);

  it("denies incident and occupational-health sensitive data across tenants", async () => {
    const userA = newPublicClient(); const userB = newPublicClient();
    await assertNoError(await userA.auth.signInWithPassword({ email: fixture.userAEmail, password }), "sign in sensitive User A");
    await assertNoError(await userB.auth.signInWithPassword({ email: fixture.userBEmail, password }), "sign in sensitive User B");
    const incident = await userA.from("incidents").insert({ organization_id: fixture.organizationA, reference_code: `CI-INC-${runId.slice(0, 8)}`, classification: "incident", summary: "Integration fixture" }).select("id").single();
    expect(incident.error).toBeNull();
    expect((await userA.from("incident_sensitive_details").insert({ incident_id: incident.data!.id, organization_id: fixture.organizationA, affected_person_reference: "fixture" })).error).toBeNull();
    expect((await userB.from("incidents").select("id").eq("id", incident.data!.id)).data).toEqual([]);
    expect((await userB.from("incident_sensitive_details").select("incident_id").eq("incident_id", incident.data!.id)).data).toEqual([]);
    const fitness = await userA.from("occupational_fitness_concepts").insert({ organization_id: fixture.organizationA, organization_member_id: fixture.memberA, concept: "fit", issued_at: "2026-08-28", issued_by_user_id: fixture.userAId }).select("id").single();
    expect(fitness.error).toBeNull();
    expect((await userB.from("occupational_fitness_concepts").select("id").eq("id", fitness.data!.id)).data).toEqual([]);
    expect((await userB.from("work_restrictions").insert({ organization_id: fixture.organizationB, occupational_fitness_concept_id: fitness.data!.id, restriction_summary: "cross tenant", effective_from: "2026-08-28" })).error).not.toBeNull();
    await Promise.all([userA.auth.signOut(), userB.auth.signOut()]);
  }, 30_000);
});
