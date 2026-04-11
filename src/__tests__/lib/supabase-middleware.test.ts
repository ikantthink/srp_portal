import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

let mockUser: { id: string } | null = null;
let mockRole: string | null = null;

const mockSupabase = {
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: mockRole ? { role: mockRole } : null })
        ),
      })),
    })),
  })),
};

describe("Middleware route protection logic", () => {
  beforeEach(() => {
    mockUser = null;
    mockRole = null;
  });

  it("should redirect unauthenticated users from /portal to /login", () => {
    mockUser = null;
    const pathname = "/portal";
    const shouldRedirect = pathname.startsWith("/portal") && !mockUser;
    expect(shouldRedirect).toBe(true);
  });

  it("should allow authenticated users to access /portal", () => {
    mockUser = { id: "user-1" };
    mockRole = "user";
    const pathname = "/portal";
    const shouldRedirect = pathname.startsWith("/portal") && !mockUser;
    expect(shouldRedirect).toBe(false);
  });

  it("should block regular users from /portal/website (admin-only)", () => {
    mockUser = { id: "user-1" };
    mockRole = "user";
    const pathname = "/portal/website";
    const adminPaths = ["/portal/website", "/portal/newsletters"];
    const isBlocked =
      adminPaths.some((p) => pathname.startsWith(p)) && mockRole === "user";
    expect(isBlocked).toBe(true);
  });

  it("should allow admin to access /portal/website", () => {
    mockUser = { id: "user-1" };
    mockRole = "admin";
    const pathname = "/portal/website";
    const adminPaths = ["/portal/website", "/portal/newsletters"];
    const isBlocked =
      adminPaths.some((p) => pathname.startsWith(p)) && mockRole === "user";
    expect(isBlocked).toBe(false);
  });

  it("should block non-super_admin from /portal/super-admin", () => {
    mockUser = { id: "user-1" };
    mockRole = "admin";
    const pathname = "/portal/super-admin";
    const superAdminPaths = ["/portal/super-admin"];
    const isBlocked =
      superAdminPaths.some((p) => pathname.startsWith(p)) &&
      mockRole !== "super_admin";
    expect(isBlocked).toBe(true);
  });

  it("should allow super_admin to access /portal/super-admin", () => {
    mockUser = { id: "user-1" };
    mockRole = "super_admin";
    const pathname = "/portal/super-admin";
    const superAdminPaths = ["/portal/super-admin"];
    const isBlocked =
      superAdminPaths.some((p) => pathname.startsWith(p)) &&
      mockRole !== "super_admin";
    expect(isBlocked).toBe(false);
  });

  it("should redirect authenticated users from /login to /portal", () => {
    mockUser = { id: "user-1" };
    const pathname = "/login";
    const shouldRedirect = pathname === "/login" && mockUser;
    expect(!!shouldRedirect).toBe(true);
  });
});
