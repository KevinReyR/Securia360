import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "wide", width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`landing is usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Del requisito a la mejora/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Crear cuenta/ }).first()).toBeVisible();
    await expect(page.getByTestId("landing-network")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test("landing network remains decorative and can be paused", async ({ page }) => {
  await page.goto("/");
  const network = page.getByTestId("landing-network");
  await expect(network).toHaveCSS("pointer-events", "none");

  const control = page.getByRole("button", { name: "Pausar fondo" });
  await expect(control).toHaveAttribute("aria-pressed", "false");
  await control.click();
  await expect(page.getByRole("button", { name: "Activar fondo" })).toHaveAttribute("aria-pressed", "true");
});

test("landing network becomes static when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("landing-network")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pausar fondo" })).toBeHidden();
});

test("landing retains a readable fallback without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Del requisito a la mejora/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Crear cuenta/ }).first()).toBeVisible();
  await context.close();
});

test("access and password recovery use clear labels", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await page.getByRole("link", { name: "¿La olvidaste?" }).click();
  await expect(page.getByRole("heading", { name: "Recupera tu acceso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar enlace" })).toBeVisible();
});
