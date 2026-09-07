import { expect, test } from "@playwright/test";

test("public initial assessment is accessible from the landing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Evaluación inicial/ }).first().click();
  await expect(page).toHaveURL(/\/evaluacion-inicial$/);
  await expect(page.getByRole("heading", { name: "Conoce el punto de partida de tu SG-SST." })).toBeVisible();
});

for (const viewport of [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "wide", width: 1440, height: 900 },
]) {
  test(`public assessment introduction fits ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/evaluacion-inicial");
    await expect(page.getByRole("heading", { name: "Conoce el punto de partida de tu SG-SST." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Iniciar evaluación" })).toBeVisible();
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflows).toBe(false);
  });
}

for (const scenario of [
  { workers: 10, risk: "II", activity: /almacenamiento y depósito de café/i, standards: 7 },
  { workers: 11, risk: "II", activity: /almacenamiento y depósito de café/i, standards: 21 },
  { workers: 10, risk: "IV", activity: /alquiler de maquinaria agrícola/i, standards: 60 },
]) {
  test(`completes the public ${scenario.standards}-standard profile`, async ({ page }) => {
    await page.goto("/evaluacion-inicial/nueva");
    await page.getByLabel("Razón social, obligatorio").fill(`Empresa E2E ${scenario.standards}`);
    await page.getByRole("combobox", { name: /Código CIIU y actividad económica/ }).click();
    await page.getByRole("combobox", { name: "Buscar actividad económica" }).fill("161-01");
    await page.getByRole("option", { name: new RegExp(`161-01.*Riesgo ${scenario.risk}`, "i") }).filter({ hasText: scenario.activity }).click();
    await expect(page.getByLabel("Clase de riesgo, obligatorio")).toHaveValue(`Clase ${scenario.risk}`);
    await expect(page.getByLabel("Clase de riesgo, obligatorio")).toHaveAttribute("readonly", "");
    await page.getByLabel("Número de trabajadores, obligatorio").fill(String(scenario.workers));
    await page.getByRole("button", { name: /Continuar/ }).click();
    await expect(page.getByText(new RegExp(`^${scenario.standards} estándares ·`))).toBeVisible();
    await page.getByRole("button", { name: /Confirmar e iniciar/ }).click();

    for (const cycle of ["Planear", "Hacer", "Verificar", "Actuar"]) {
      await page.getByRole("button", { name: cycle, exact: true }).click();
      const radios = page.getByRole("radio", { name: "Cumple", exact: true });
      for (let index = 0; index < await radios.count(); index += 1) await radios.nth(index).click();
    }

    await page.getByRole("button", { name: /Revisar respuestas/ }).click();
    await expect(page.getByText("Todas las respuestas están completas.")).toBeVisible();
    await page.getByRole("button", { name: /Finalizar y ver resultado/ }).click();
    await expect(page.getByText("100.00", { exact: true })).toBeVisible();
    await expect(page.getByText("Aceptable", { exact: true })).toBeVisible();
  });
}

test("CIIU search preserves duplicate-code activities and supports keyboard on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/evaluacion-inicial/nueva");
  await page.getByRole("combobox", { name: /Código CIIU y actividad económica/ }).click();
  const search = page.getByRole("combobox", { name: "Buscar actividad económica" });
  await search.fill("161-01");
  await expect(page.getByRole("option")).toHaveCount(3);
  await expect(page.getByText(/almacenamiento y depósito de café/i)).toBeVisible();
  await expect(page.getByText(/alquiler de maquinaria agrícola/i)).toBeVisible();
  await expect(page.getByText(/fumigación y fertilización aérea/i)).toBeVisible();
  await search.press("Enter");
  await expect(page.getByLabel("Clase de riesgo, obligatorio")).toHaveValue("Clase II");
});

test("a draft resumes after reloading and an unknown id explains local-only storage", async ({ page }) => {
  await page.goto("/evaluacion-inicial/nueva");
  await page.getByLabel("Razón social, obligatorio").fill("Empresa Reanudación SAS");
  await page.getByRole("combobox", { name: /Código CIIU y actividad económica/ }).click();
  await page.getByRole("combobox", { name: "Buscar actividad económica" }).fill("161-01");
  await page.getByRole("option", { name: /161-01.*Riesgo II/i }).filter({ hasText: /almacenamiento y depósito de café/i }).click();
  await page.getByLabel("Número de trabajadores, obligatorio").fill("10");
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByRole("button", { name: /Confirmar e iniciar/ }).click();
  await expect(page).toHaveURL(/\/evaluacion-inicial\/nueva\?assessment=/);
  await page.getByRole("radio", { name: "Cumple", exact: true }).first().click();
  await page.reload();
  await expect(page.getByText(/1 de 7/).first()).toBeVisible();

  await page.goto("/evaluacion-inicial/11111111-1111-4111-8111-111111111111");
  await expect(page.getByRole("heading", { name: "No encontramos este resultado" })).toBeVisible();
});
