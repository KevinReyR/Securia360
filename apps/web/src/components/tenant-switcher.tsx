"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Buildings } from "@phosphor-icons/react";
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
      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-2.5 shadow-[var(--shadow-control)] focus-within:border-[var(--brand)] focus-within:ring-3 focus-within:ring-[var(--focus-ring)]">
        <Buildings size={17} className="shrink-0 text-[var(--brand)]" aria-hidden />
        <select
        id="organization-switcher"
        name="organizationId"
        defaultValue={activeId}
        onChange={() => {
          queryClient.clear();
          formRef.current?.requestSubmit();
        }}
        className="h-9 min-w-0 max-w-64 flex-1 truncate bg-transparent pr-3 text-sm font-semibold text-[var(--foreground)] outline-none"
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
        </select>
      </div>
    </form>
  );
}
