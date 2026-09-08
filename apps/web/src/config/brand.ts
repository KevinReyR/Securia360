export const brand = {
  name: "Securia360",
  shortName: "Securia",
  company: "Reinova Labs",
  descriptor: "Gestión integral de seguridad y salud en el trabajo",
  tagline: "Convierte obligaciones en trabajo claro, trazable y verificable.",
  contactEmail: "reinovaco@gmail.com",
  whatsappNumber: "573167468566",
  whatsappMessage: "Hola, quiero conocer Securia360 y adquirir el servicio.",
  heroImage: "/brand/workplace-safety-hero.png",
} as const;

export type BrandConfig = typeof brand;
