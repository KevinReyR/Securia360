/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import {
  acceptPpeDelivery,
  createPpeAssignment,
  createPpeCatalog,
  createPpeInventory,
  deliverPpe,
  inspectPpe,
  recordPpeInventoryMovement,
  retirePpe,
} from "@/modules/ppe/actions";

const PAGE_SIZE = 20;
export default async function PpePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { userId, supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, validate, membership] = await Promise.all([
    can(organizationId, "ppe.read"),
    can(organizationId, "ppe.manage"),
    can(organizationId, "ppe.validate"),
    db
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (!read && !membership.data)
    return (
      <EmptyState
        title="Sin permiso"
        description="Solicita acceso a los elementos de protección personal."
      />
    );
  const q = (filters.q ?? "").slice(0, 120);
  const page = Math.max(1, Number(filters.page ?? "1") || 1);
  const status = filters.status ?? "active";
  let catalogQuery = db
    .from("ppe_catalog")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q)
    catalogQuery = catalogQuery.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  let assignmentQuery = db
    .from("ppe_assignments")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (status !== "all") assignmentQuery = assignmentQuery.eq("status", status);
  const [
    catalogR,
    inventoryR,
    assignmentsR,
    deliveriesR,
    inspectionsR,
    movementsR,
    membersR,
    sitesR,
    hazardsR,
    controlsR,
    documentVersionsR,
  ] = await Promise.all([
    catalogQuery,
    read
      ? db
          .from("ppe_inventory")
          .select("*")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    assignmentQuery,
    db
      .from("ppe_deliveries")
      .select("*")
      .eq("organization_id", organizationId)
      .order("delivered_at", { ascending: false }),
    read
      ? db
          .from("ppe_inspections")
          .select("*")
          .eq("organization_id", organizationId)
          .order("inspected_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    read
      ? db
          .from("ppe_inventory_movements")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(60)
      : Promise.resolve({ data: [] }),
    manage
      ? db
          .from("organization_members")
          .select("id,user_id")
          .eq("organization_id", organizationId)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
    manage
      ? db
          .from("sites")
          .select("id,name")
          .eq("organization_id", organizationId)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
    manage
      ? db.from("hazard_catalog").select("id,name").limit(100)
      : Promise.resolve({ data: [] }),
    manage
      ? db
          .from("risk_controls")
          .select("id,description")
          .eq("organization_id", organizationId)
          .limit(100)
      : Promise.resolve({ data: [] }),
    validate
      ? db
          .from("document_versions")
          .select("id,original_name")
          .eq("organization_id", organizationId)
          .limit(80)
      : Promise.resolve({ data: [] }),
  ]);
  const catalog = catalogR.data ?? [],
    inventory = inventoryR.data ?? [],
    assignments = assignmentsR.data ?? [],
    deliveries = deliveriesR.data ?? [],
    inspections = inspectionsR.data ?? [],
    members = membersR.data ?? [],
    sites = sitesR.data ?? [],
    versions = documentVersionsR.data ?? [];
  const hidden = (
    <input type="hidden" name="organizationId" value={organizationId} />
  );
  const evidence = (
    <>
      <select name="evidence_document_version_id" defaultValue="">
        <option value="">Sin evidencia existente</option>
        {versions.map((v: any) => (
          <option key={v.id} value={v.id}>
            {v.original_name}
          </option>
        ))}
      </select>
      <Input
        name="evidence_file"
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
      />
    </>
  );
  const catalogName = (id: string) =>
    catalog.find((item: any) => item.id === id)?.name ?? "Elemento";
  return (
    <main className="grid gap-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold">
          Elementos de protección personal
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Inventario trazable, entrega verificable y evidencia privada por
          trabajador.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-2">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar elemento"
              aria-label="Buscar EPP"
            />
            <select name="status" defaultValue={status}>
              <option value="active">Asignaciones activas</option>
              <option value="retired">Retiradas</option>
              <option value="all">Todas</option>
            </select>
            <Button>Filtrar</Button>
          </form>
        </CardContent>
      </Card>
      {manage ? (
        <section className="grid gap-3 lg:grid-cols-3">
          <Card>
            <CardHeader>Nuevo elemento</CardHeader>
            <CardContent>
              <form action={createPpeCatalog} className="grid gap-2">
                {hidden}
                <Input name="code" placeholder="CASCO-01" required />
                <Input name="name" placeholder="Nombre del EPP" required />
                <Input name="category" placeholder="Categoría" required />
                <Input
                  name="useful_life_days"
                  type="number"
                  min="1"
                  placeholder="Vida útil (días)"
                />
                <select name="hazard_id">
                  <option value="">Sin peligro asociado</option>
                  {(hazardsR.data ?? []).map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <select name="risk_control_id">
                  <option value="">Sin control asociado</option>
                  {(controlsR.data ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.description}
                    </option>
                  ))}
                </select>
                <Button>Crear catálogo</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Ubicación de inventario</CardHeader>
            <CardContent>
              <form action={createPpeInventory} className="grid gap-2">
                {hidden}
                <select name="ppe_catalog_id">
                  {catalog.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <select name="site_id">
                  <option value="">Bodega general</option>
                  {sites.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input name="size_label" placeholder="Talla (opcional)" />
                <Input
                  name="reorder_point"
                  type="number"
                  min="0"
                  placeholder="Punto de reposición"
                />
                <Button>Crear ubicación</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Asignar a trabajador</CardHeader>
            <CardContent>
              <form action={createPpeAssignment} className="grid gap-2">
                {hidden}
                <select name="organization_member_id">
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.user_id}
                    </option>
                  ))}
                </select>
                <select name="ppe_catalog_id">
                  {catalog.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <select name="site_id">
                  <option value="">Sin sede</option>
                  {sites.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input name="size_label" placeholder="Talla" />
                <Input name="expected_replacement_at" type="date" />
                <Button>Asignar</Button>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}
      {manage ? (
        <section className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader>Entrada o ajuste de stock</CardHeader>
            <CardContent>
              <form action={recordPpeInventoryMovement} className="grid gap-2">
                {hidden}
                <select name="inventory_id">
                  {inventory.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {catalogName(x.ppe_catalog_id)} ·{" "}
                      {x.size_label || "Sin talla"} · {x.quantity_on_hand}
                    </option>
                  ))}
                </select>
                <select name="movement_type">
                  <option value="purchase">Compra</option>
                  <option value="return">Devolución</option>
                  <option value="adjustment">Ajuste</option>
                </select>
                <Input
                  name="quantity"
                  type="number"
                  placeholder="Cantidad"
                  required
                />
                <Textarea name="note" placeholder="Motivo o referencia" />
                <Button>Registrar movimiento</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Inventario y alertas</CardHeader>
            <CardContent className="grid gap-2">
              {inventory.length ? (
                inventory.map((x: any) => (
                  <p key={x.id} className="rounded border p-2 text-sm">
                    {catalogName(x.ppe_catalog_id)} ·{" "}
                    {x.size_label || "Sin talla"}:{" "}
                    <strong>{x.quantity_on_hand}</strong>
                    {x.reorder_point !== null &&
                    x.quantity_on_hand <= x.reorder_point
                      ? " · Reposición requerida"
                      : ""}
                  </p>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  No hay inventario aún.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Asignaciones e historial</h2>
        {assignments.length ? (
          assignments.map((assignment: any) => {
            const assignmentDeliveries = deliveries.filter(
              (d: any) => d.ppe_assignment_id === assignment.id,
            );
            const due =
              assignment.life_expires_at &&
              new Date(`${assignment.life_expires_at}T00:00:00Z`) < new Date();
            return (
              <Card key={assignment.id}>
                <CardHeader>
                  {catalogName(assignment.ppe_catalog_id)} · {assignment.status}
                  {assignment.replacement_required || due
                    ? " · Reemplazo requerido"
                    : ""}
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm text-[var(--muted)]">
                    Talla: {assignment.size_label || "No aplica"} · Vida útil:{" "}
                    {assignment.life_expires_at ?? "Sin vencimiento"}
                  </p>
                  {validate && assignment.status === "active" ? (
                    <div className="grid gap-3 lg:grid-cols-3">
                      <form
                        action={deliverPpe}
                        className="grid gap-2 rounded border p-2"
                      >
                        {hidden}
                        <input
                          type="hidden"
                          name="assignment_id"
                          value={assignment.id}
                        />
                        <select name="inventory_id">
                          {inventory
                            .filter(
                              (x: any) =>
                                x.ppe_catalog_id ===
                                  assignment.ppe_catalog_id &&
                                x.size_label === assignment.size_label,
                            )
                            .map((x: any) => (
                              <option key={x.id} value={x.id}>
                                {x.quantity_on_hand} disponibles
                              </option>
                            ))}
                        </select>
                        <Input
                          name="quantity"
                          type="number"
                          min="1"
                          placeholder="Cantidad"
                          required
                        />
                        <select name="delivery_kind">
                          <option
                            value={
                              assignmentDeliveries.length
                                ? "replacement"
                                : "initial"
                            }
                          >
                            {assignmentDeliveries.length
                              ? "Reposición"
                              : "Entrega inicial"}
                          </option>
                        </select>
                        {evidence}
                        <Button size="sm">Entregar</Button>
                      </form>
                      <form
                        action={inspectPpe}
                        className="grid gap-2 rounded border p-2"
                      >
                        {hidden}
                        <input
                          type="hidden"
                          name="assignment_id"
                          value={assignment.id}
                        />
                        <select name="status">
                          <option value="suitable">Apto</option>
                          <option value="needs_replacement">
                            Requiere reposición
                          </option>
                          <option value="failed">No apto</option>
                        </select>
                        <Textarea
                          name="notes"
                          placeholder="Resultado de inspección"
                        />
                        {evidence}
                        <Button size="sm">Inspeccionar</Button>
                      </form>
                      <form
                        action={retirePpe}
                        className="grid gap-2 rounded border p-2"
                      >
                        {hidden}
                        <input
                          type="hidden"
                          name="assignment_id"
                          value={assignment.id}
                        />
                        <Textarea
                          name="reason"
                          placeholder="Motivo de baja"
                          required
                        />
                        {evidence}
                    <Button size="sm" variant="secondary">
                          Dar de baja
                        </Button>
                      </form>
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    {assignmentDeliveries.map((d: any) => (
                      <div
                        className="flex flex-wrap items-center gap-2 rounded border p-2 text-sm"
                        key={d.id}
                      >
                        Entrega {d.delivery_kind} · {d.quantity} ·{" "}
                        {new Date(d.delivered_at).toLocaleDateString("es-CO")} ·{" "}
                        {d.accepted_at ? "Aceptada" : "Pendiente de aceptación"}
                        {!d.accepted_at && assignment.organization_member_id === membership.data?.id ? (
                          <form action={acceptPpeDelivery}>
                            {hidden}
                            <input
                              type="hidden"
                              name="delivery_id"
                              value={d.id}
                            />
                            <Button size="sm">Aceptar entrega</Button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {read ? (
                    <p className="text-sm text-[var(--muted)]">
                      Inspecciones:{" "}
                      {
                        inspections.filter(
                          (i: any) => i.ppe_assignment_id === assignment.id,
                        ).length
                      }
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <EmptyState
            title="Sin asignaciones"
            description="Crea un elemento y asígnalo a un trabajador activo."
          />
        )}
      </section>
      {read ? (
        <Card>
          <CardHeader>Movimientos recientes</CardHeader>
          <CardContent className="grid gap-1 text-sm">
            {(movementsR.data ?? []).length ? (
              (movementsR.data ?? []).map((m: any) => (
                <p key={m.id}>
                  {m.movement_type} · {m.quantity_delta > 0 ? "+" : ""}
                  {m.quantity_delta} ·{" "}
                  {new Date(m.created_at).toLocaleString("es-CO")}
                </p>
              ))
            ) : (
              <p className="text-[var(--muted)]">No hay movimientos.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
