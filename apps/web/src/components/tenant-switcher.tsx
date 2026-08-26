"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { switchOrganization } from "@/modules/organizations/tenant-actions";
import type { OrganizationSummary } from "@/modules/organizations/tenant";

export function TenantSwitcher({ organizations, activeId }: { organizations: OrganizationSummary[]; activeId: string }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchOrganization} className="min-w-0">
      <input type="hidden" name="next" value={pathname} />
      <label className="sr-only" htmlFor="organization-switcher">Organización activa</label>
      <select
        id="organization-switcher"
        name="organizationId"
        defaultValue={activeId}
        onChange={() => {
          queryClient.clear();
          formRef.current?.requestSubmit();
        }}
        className="h-9 max-w-56 truncate rounded-lg border border-[var(--sidebar-border)] bg-[var(--sidebar-surface)] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-300"
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id} className="text-slate-900">
            {organization.name}
          </option>
        ))}
      </select>
    </form>
  );
}
