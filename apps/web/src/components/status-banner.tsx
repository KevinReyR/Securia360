export function StatusBanner({ status }: { status?: string }) {
  if (!status) return null;
  const success = status === "saved";
  return <p role="status" className={`mb-5 rounded-lg px-4 py-3 text-sm ${success ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-[var(--danger-bg)] text-[var(--danger)]"}`}>{success ? "Cambios guardados correctamente." : "No fue posible guardar. Revisa los datos y tus permisos."}</p>;
}
