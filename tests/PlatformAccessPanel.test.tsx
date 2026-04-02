import { render, screen, waitFor } from "@testing-library/react";
import { PlatformAccessPanel } from "@/app/platfrom/PlatformAccessPanel";

const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockSignInWithOAuth = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe("PlatformAccessPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock | undefined) = jest.fn();
  });

  it("shows pending review message and keeps Google re-check action visible", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, status: "pending" }),
    });

    render(
      <PlatformAccessPanel
        signInLabel="Ingresar con"
        providerLabel="Google"
        signInErrorLabel="No se pudo iniciar sesión con Google. Intenta nuevamente."
        checkingLabel="Validando tu acceso a la plataforma..."
        pendingTitle="Cuenta en revision"
        pendingBody="Tu cuenta esta siendo revisada por el personal. Una vez aprobada, te enviaremos una notificacion por correo."
        approvedTitle="Acceso aprobado"
        approvedBody="Tu cuenta ya fue aprobada. Puedes continuar al dashboard de la plataforma."
        configErrorTitle="Configuracion pendiente de la plataforma"
        configErrorBody="El acceso a la plataforma no esta disponible temporalmente."
        accountRemovedTitle="Solicitud de acceso cerrada"
        accountRemovedBody="Esta cuenta ya no esta disponible para acceso a la plataforma."
        backHomeLabel="Volver al inicio"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Cuenta en revision")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Ingresar con Google" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("redirects directly to dashboard when account is approved", async () => {
    const onApprovedRedirect = jest.fn();

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, status: "approved" }),
    });

    render(
      <PlatformAccessPanel
        signInLabel="Ingresar con"
        providerLabel="Google"
        signInErrorLabel="No se pudo iniciar sesión con Google. Intenta nuevamente."
        checkingLabel="Validando tu acceso a la plataforma..."
        pendingTitle="Cuenta en revision"
        pendingBody="Tu cuenta esta siendo revisada por el personal. Una vez aprobada, te enviaremos una notificacion por correo."
        approvedTitle="Acceso aprobado"
        approvedBody="Tu cuenta ya fue aprobada. Puedes continuar al dashboard de la plataforma."
        configErrorTitle="Configuracion pendiente de la plataforma"
        configErrorBody="El acceso a la plataforma no esta disponible temporalmente."
        accountRemovedTitle="Solicitud de acceso cerrada"
        accountRemovedBody="Esta cuenta ya no esta disponible para acceso a la plataforma."
        backHomeLabel="Volver al inicio"
        onApprovedRedirect={onApprovedRedirect}
      />
    );

    await waitFor(() => {
      expect(onApprovedRedirect).toHaveBeenCalledWith("/platfrom/dashboard");
    });
  });
});
