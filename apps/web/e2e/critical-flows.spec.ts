import { expect, test, type Page } from "@playwright/test";
import { createE2EFixture, type E2EFixture } from "./fixtures";

const enabled = [
  process.env.SUPABASE_TEST_URL,
  process.env.SUPABASE_TEST_PUBLISHABLE_KEY,
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
].every(Boolean);

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/(organizations|internal\/saas-admin|org\/[^/]+\/dashboard)$/);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Abrir menú de perfil" }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL(/\/auth\/login$/);
}

async function continueOnboarding(page: Page, heading: string) {
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

test.describe("critical isolated SaaS flows", () => {
  test.skip(!enabled, "E2E credentials are available only in the protected CI environment.");
  test.describe.configure({ mode: "serial" });

  let fixture: E2EFixture;

  test.beforeAll(async () => {
    fixture = await createE2EFixture();
  });

  test.afterAll(async () => {
    await fixture?.cleanup();
  });

  test("routes an internal administrator to the platform console and denies a tenant administrator", async ({ page }) => {
    await login(page, fixture.internalAdmin.email, fixture.internalAdmin.password);
    await expect(page).toHaveURL(/\/internal\/saas-admin/);
    await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Planes" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.waitForURL(/\/auth\/login$/);

    await login(page, fixture.userA.email, fixture.userA.password);
    await page.goto("/internal/saas-admin");
    await expect(page).toHaveURL(/\/organizations$/);
  });

  test("signs up without email confirmation, resumes onboarding, completes it, and logs out", async ({ page }) => {
    const email = `e2e-signup-${crypto.randomUUID()}@example.invalid`;
    const password = "Securia360-E2E-Signup-A9!";
    const name = `E2E Signup ${fixture.runId.slice(0, 8)}`;
    const slug = `e2e-signup-${crypto.randomUUID().slice(0, 8)}`;

    try {
      await page.goto("/auth/signup");
      await page.getByLabel("Nombre").fill("E2E");
      await page.getByLabel("Apellido").fill("Signup");
      await page.getByLabel("Correo electrónico").fill(email);
      await page.getByLabel("Contraseña").fill(password);
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await page.waitForURL(/\/organizations$/);
      await expect(page.getByText("Aún no perteneces a ninguna organización.")).toBeVisible();

      await page.getByLabel("Nombre").fill(name);
      await page.getByLabel("Identificador URL").fill(slug);
      await page.getByLabel("NIT").fill(`E2E-${fixture.runId.slice(0, 8)}`);
      await page.getByRole("button", { name: "Crear y configurar" }).click();
      await page.waitForURL(/\/org\/[^/]+\/onboarding$/);
      const onboardingUrl = page.url();

      await page.getByLabel("Nombre de la organización").fill(name);
      await page.getByLabel("NIT").fill(`E2E-${fixture.runId.slice(0, 8)}`);
      await continueOnboarding(page, "Razón social");
      await page.getByLabel("Razón social").fill(`${name} SAS`);
      await page.getByLabel("Nombre comercial").fill(name);
      await page.getByLabel("Identificación tributaria").fill(`E2E-RS-${fixture.runId.slice(0, 8)}`);
      await continueOnboarding(page, "Actividad económica");

      await page.reload();
      await expect(page.getByText("Paso 3 de 9")).toBeVisible();
      await expect(page).toHaveURL(onboardingUrl);
      await page.getByLabel("Actividad económica principal").fill("Servicios profesionales");
      await continueOnboarding(page, "CIIU");
      await page.getByLabel("Código CIIU").fill("6201");
      await continueOnboarding(page, "Trabajadores");
      await page.getByLabel("Número de trabajadores").fill("12");
      await continueOnboarding(page, "Clase de riesgo");
      await page.getByLabel("Clase de riesgo").selectOption("2");
      await continueOnboarding(page, "Sedes");
      const firstSite = page.getByRole("group", { name: "Sede 1" });
      await firstSite.getByLabel("Nombre").fill("Sede E2E");
      await firstSite.getByLabel("Código").fill("E2E-01");
      await firstSite.getByLabel("Dirección").fill("Calle 1 # 2-3");
      await firstSite.getByLabel("Ciudad").fill("Bogotá");
      await firstSite.getByLabel("Departamento").fill("Cundinamarca");
      await continueOnboarding(page, "Responsable SST");
      await page.getByLabel("Miembro responsable del SG-SST").selectOption({ index: 1 });
      await continueOnboarding(page, "Caracterización");
      await page.getByText("Trabajo en alturas").click();
      await page.getByRole("button", { name: "Finalizar configuración" }).click();
      await page.waitForURL(/\/org\/[^/]+\/dashboard\?onboarding=complete$/);
      await expect(page.getByRole("heading", { name: `Hola, ${name}` })).toBeVisible();

      await logout(page);
      await page.goto(onboardingUrl);
      await page.waitForURL(/\/auth\/login\?next=/);
    } finally {
      await fixture.deleteUserByEmail(email);
    }
  });

  test("logs in and switches organizations without preserving the previous tenant view", async ({ page }) => {
    await login(page, fixture.switcher.email, fixture.switcher.password);
    await page.goto("/organizations");
    await page.locator("form").filter({ hasText: fixture.organizationAName }).getByRole("button", { name: "Abrir" }).click();
    await expect(page.getByRole("heading", { name: `Hola, ${fixture.organizationAName}` })).toBeVisible();

    await page.locator("#organization-switcher").selectOption(fixture.organizationB);
    await page.waitForURL(new RegExp(`/org/${fixture.organizationB}/dashboard$`));
    await expect(page.getByRole("heading", { name: `Hola, ${fixture.organizationBName}` })).toBeVisible();
    await expect(page.getByRole("heading", { name: `Hola, ${fixture.organizationAName}` })).toHaveCount(0);
    await logout(page);
  });

  test("creates, edits, and safely deletes the legal entity, site, and area structure", async ({ page }) => {
    const suffix = fixture.runId.slice(0, 8);
    const entityName = `E2E CRUD Razón ${suffix}`;
    const siteName = `E2E CRUD Sede ${suffix}`;
    const areaName = `E2E CRUD Área ${suffix}`;
    await login(page, fixture.userA.email, fixture.userA.password);
    await page.goto(`/org/${fixture.organizationA}/settings/structure`);

    const entityForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar razón social" }) });
    await entityForm.getByLabel("Razón social").fill(entityName);
    await entityForm.getByLabel("NIT").fill(`E2E-CRUD-${suffix}`);
    await entityForm.getByRole("button", { name: "Agregar razón social" }).click();
    await expect(page.getByText(entityName, { exact: true })).toBeVisible();
    await page.getByText(entityName, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'border')][1]").getByText("Editar datos").click();
    await page.getByLabel("Razón social").last().fill(`${entityName} Editada`);
    await page.getByRole("button", { name: "Guardar cambios" }).first().click();
    await expect(page.getByText(`${entityName} Editada`, { exact: true })).toBeVisible();

    const siteForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar sede" }) });
    await siteForm.getByLabel("Razón social").selectOption({ label: `${entityName} Editada` });
    await siteForm.getByLabel("Nombre").fill(siteName);
    await siteForm.getByLabel("Código").fill(`CRUD-${suffix}`);
    await siteForm.getByRole("button", { name: "Agregar sede" }).click();
    await expect(page.getByText(siteName, { exact: true })).toBeVisible();

    const areaForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Agregar área" }) });
    await areaForm.getByLabel("Sede").selectOption({ label: siteName });
    await areaForm.getByLabel("Nombre").fill(areaName);
    await areaForm.getByLabel("Código").fill(`AREA-${suffix}`);
    await areaForm.getByRole("button", { name: "Agregar área" }).click();
    await expect(page.getByText(areaName, { exact: true })).toBeVisible();

    const areaCard = page.getByText(areaName, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'border')][1]");
    await areaCard.getByRole("button", { name: "Eliminar" }).click();
    await areaCard.getByLabel(new RegExp(`Escribe ${areaName}`)).fill(areaName);
    await areaCard.getByRole("button", { name: "Eliminar área" }).click();
    await expect(page.getByText(areaName, { exact: true })).toHaveCount(0);

    const siteCard = page.getByText(siteName, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'border')][1]");
    await siteCard.getByRole("button", { name: "Eliminar" }).click();
    await siteCard.getByLabel(new RegExp(`Escribe ${siteName}`)).fill(siteName);
    await siteCard.getByRole("button", { name: "Eliminar sede" }).click();
    await expect(page.getByText(siteName, { exact: true })).toHaveCount(0);

    const entityCard = page.getByText(`${entityName} Editada`, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'border')][1]");
    await entityCard.getByRole("button", { name: "Eliminar" }).click();
    await entityCard.getByLabel(new RegExp(`Escribe ${entityName} Editada`)).fill(`${entityName} Editada`);
    await entityCard.getByRole("button", { name: "Eliminar razón social" }).click();
    await expect(page.getByText(`${entityName} Editada`, { exact: true })).toHaveCount(0);
    await logout(page);
  });

  test("uploads, downloads through a signed URL, archives, and logically deletes a private document", async ({ page }) => {
    const title = `E2E Documento ${fixture.runId.slice(0, 8)}`;
    await login(page, fixture.userA.email, fixture.userA.password);
    await page.goto(`/org/${fixture.organizationA}/documents`);
    await page.getByLabel("Título").fill(title);
    await page.getByLabel("Tipo de entidad").fill("organization");
    await page.getByLabel("ID de entidad").fill(fixture.organizationA);
    await page.getByLabel("Archivo PDF o imagen").setInputFiles({ name: "e2e.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nE2E fixture") });
    await page.getByRole("button", { name: "Cargar archivo privado" }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await page.getByText(title, { exact: true }).click();
    await expect(page.getByText("Versión 1")).toBeVisible();
    const signedResponse = page.waitForResponse((response) => response.url().includes("/storage/v1/object/sign/") && response.status() === 200);
    await page.getByRole("button", { name: "Descargar enlace seguro" }).click();
    await signedResponse;
    await page.getByRole("button", { name: "Archivar documento" }).click();
    await expect(page.getByText("Estado: archived")).toBeVisible();
    await page.getByLabel(new RegExp(`Escribe ${title}`)).fill(title);
    await page.getByRole("button", { name: "Eliminar lógicamente" }).click();
    await page.waitForURL(new RegExp(`/org/${fixture.organizationA}/documents\\?status=deleted$`));
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    await logout(page);
  });

  test("assigns a role through the UI and permits the newly scoped operation", async ({ page, context }) => {
    await login(page, fixture.userA.email, fixture.userA.password);
    await page.goto(`/org/${fixture.organizationA}/settings/members`);
    const roleForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Asignar rol" }) });
    await roleForm.getByLabel("Miembro").selectOption({ label: "E2E member Fixture" });
    await roleForm.getByLabel("Rol").selectOption(fixture.siteManagerRole);
    await roleForm.getByLabel("Alcance").selectOption(fixture.siteA);
    await roleForm.getByRole("button", { name: "Asignar rol" }).click();
    await expect(page.getByText("Responsable de sede")).toBeVisible();
    await logout(page);

    await context.clearCookies();
    await login(page, fixture.member.email, fixture.member.password);
    await page.goto(`/org/${fixture.organizationA}/settings/structure`);
    const siteCard = page.getByText(new RegExp(`E2E Sede A ${fixture.runId.slice(0, 8)}`)).locator("xpath=ancestor::div[contains(@class, 'border')][1]");
    await siteCard.getByText("Editar datos").click();
    await siteCard.getByLabel("Nombre").fill(`E2E Sede A actualizada ${fixture.runId.slice(0, 8)}`);
    await siteCard.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText(`E2E Sede A actualizada ${fixture.runId.slice(0, 8)}`, { exact: true })).toBeVisible();
    await logout(page);
  });

  test("creates an action from a gap, attaches evidence, validates it, and closes the gap", async ({ page }) => {
    const title = `E2E Acción ${fixture.runId.slice(0, 8)}`;
    await login(page, fixture.userA.email, fixture.userA.password);
    await page.goto(`/org/${fixture.organizationA}/improvement-plan`);
    const gapCard = page.getByRole("heading", { name: fixture.improvementGapTitle }).locator("xpath=ancestor::div[contains(@class, 'border')][1]");
    await gapCard.getByLabel("Nueva acción").fill(title);
    await gapCard.getByLabel("Descripción").first().fill("Completar evidencia verificable.");
    await gapCard.getByRole("button", { name: "Crear acción" }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    const actionCard = page.getByText(title, { exact: true }).locator("xpath=ancestor::article[1]");
    await actionCard.getByLabel("Cargar evidencia privada").setInputFiles({ name: "evidencia.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nE2E improvement evidence") });
    await actionCard.getByRole("button", { name: "Vincular evidencia" }).click();
    await expect(actionCard.getByText("evidence_submitted", { exact: true })).toBeVisible();
    await actionCard.getByLabel("Nota de validación").fill("Evidencia revisada y suficiente.");
    await actionCard.getByRole("button", { name: "Validar y cerrar acción" }).click();
    await expect(actionCard.getByText("verified", { exact: true })).toBeVisible();
    await gapCard.getByRole("button", { name: "Cerrar brecha validada" }).click();
    await expect(gapCard.getByText("resolved", { exact: true })).toBeVisible();
    await logout(page);
  });

  test("denies direct tenant B navigation to a user that only belongs to tenant A", async ({ page }) => {
    await login(page, fixture.userA.email, fixture.userA.password);
    await page.goto(`/org/${fixture.organizationB}/dashboard`);
    await page.waitForURL(/\/organizations\?error=access$/);
    await expect(page.getByText(fixture.organizationBName, { exact: true })).toHaveCount(0);
  });
});
