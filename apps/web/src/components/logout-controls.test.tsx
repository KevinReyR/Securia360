// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton, LogoutMenuItem } from "./logout-controls";
import { DropdownMenu, DropdownMenuContent } from "./ui/dropdown-menu";

const replace = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signOut } }) }));

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("closes only the local session and redirects to login", async () => {
    signOut.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ scope: "local" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/login"));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("executes logout from the profile menu without submitting a nested form", async () => {
    signOut.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<DropdownMenu open><DropdownMenuContent><LogoutMenuItem /></DropdownMenuContent></DropdownMenu>);

    await user.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ scope: "local" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/login"));
  });

  it("prevents repeated requests while logout is pending", async () => {
    let resolveSignOut: ((value: { error: null }) => void) | undefined;
    signOut.mockImplementation(() => new Promise((resolve) => { resolveSignOut = resolve; }));
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Cerrar sesión" });
    await user.click(button);
    await user.click(button);

    expect(signOut).toHaveBeenCalledOnce();
    resolveSignOut?.({ error: null });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/login"));
  });

  it("keeps the user in place and explains a failed logout", async () => {
    signOut.mockResolvedValue({ error: new Error("offline") });
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar la sesión");
    expect(replace).not.toHaveBeenCalled();
  });
});
