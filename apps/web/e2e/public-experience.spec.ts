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
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test("access and password recovery use clear labels", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await page.getByRole("link", { name: "¿La olvidaste?" }).click();
  await expect(page.getByRole("heading", { name: "Recupera tu acceso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar enlace" })).toBeVisible();
});
