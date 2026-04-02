import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SuperadminDevTools } from "@/app/platfrom/dashboard/superadmin/dev/SuperadminDevTools";

const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}));

describe("SuperadminDevTools", () => {
  const baseProps = {
    title: "Herramientas de desarrollo",
    subtitle: "Crea cuentas sembradas para QA.",
    quickUnauthorizedTitle: "Crear cuenta no autorizada (tipo Google)",
    quickUnauthorizedSubtitle: "Crea cuenta invitado pendiente y solicitud pendiente.",
    quickUnauthorizedSubmitLabel: "Crear",
    quickUnauthorizedSubmittingLabel: "Crear",
    quickUnauthorizedSuccessLabel: "Cuenta no autorizada creada para {email}.",
    quickUnauthorizedPasswordLabel: "Contrasena",
    quickUnauthorizedPasswordPlaceholder: "Minimo 8 caracteres",
    showPasswordLabel: "Mostrar contrasena",
    hidePasswordLabel: "Ocultar contrasena",
    emailLabel: "Correo",
    emailPlaceholder: "qa.usuario@ejemplo.com",
    fullNameLabel: "Nombre completo",
    fullNamePlaceholder: "Usuario QA",
    passwordLabel: "Contrasena temporal",
    passwordPlaceholder: "Minimo 8 caracteres",
    roleLabel: "Rol asignado",
    statusLabel: "Estatus de aprobacion",
    localeLabel: "Idioma preferido",
    submitLabel: "Crear",
    submittingLabel: "Crear",
    sessionErrorLabel: "Debes iniciar sesion para crear cuentas sembradas.",
    genericErrorLabel: "No se pudo crear la cuenta sembrada. Verifica permisos e intenta nuevamente.",
    emailAuthDisabledErrorLabel: "El auth por correo esta deshabilitado. Activa AUTH_ENABLE_EMAIL_LOGIN para usar esta herramienta.",
    forbiddenErrorLabel: "Solo superadmin puede crear cuentas desde esta herramienta.",
    duplicateEmailErrorLabel: "Ese correo ya existe. Usa otro correo o elimina la cuenta previa.",
    serviceRoleMissingErrorLabel: "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.",
    invalidInputErrorLabel: "Datos invalidos. Verifica correo, contrasena y campos requeridos.",
    successLabel: "Cuenta sembrada creada para {email}.",
    roles: [
      { value: "guest", label: "Invitado" },
      { value: "parent", label: "Padre o madre" },
    ],
    statuses: [
      { value: "approved", label: "Aprobado" },
      { value: "pending", label: "Pendiente" },
    ],
    locales: [
      { value: "es-MX" as const, label: "Espanol (Mexico)" },
      { value: "en-US" as const, label: "Ingles (EE. UU.)" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock | undefined) = jest.fn();
  });

  it("shows session error when no access token is available", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: null,
      },
    });

    render(<SuperadminDevTools {...baseProps} />);

    fireEvent.change(screen.getAllByLabelText("Correo")[1], { target: { value: "qa.user@example.com" } });
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "QA User" } });
    fireEvent.change(screen.getByLabelText("Contrasena temporal"), { target: { value: "password123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Crear" })[1]);

    await waitFor(() => {
      expect(screen.getByText("Debes iniciar sesion para crear cuentas sembradas.")).toBeInTheDocument();
    });
  });

  it("creates unauthorized account with email and password", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, email: "pending.user@example.com" }),
    });

    render(<SuperadminDevTools {...baseProps} />);

    fireEvent.change(screen.getAllByLabelText("Correo")[0], { target: { value: "pending.user@example.com" } });
    fireEvent.change(screen.getAllByLabelText("Contrasena")[0], { target: { value: "pending123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Crear" })[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/email-users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "pending.user@example.com",
            password: "pending123",
            createUnauthorizedOnly: true,
          }),
        })
      );
    });

    expect(screen.getByText("Cuenta no autorizada creada para pending.user@example.com.")).toBeInTheDocument();
  });

  it("toggles password visibility for both password inputs", () => {
    render(<SuperadminDevTools {...baseProps} />);

    const quickPasswordInput = screen.getAllByLabelText("Contrasena")[0] as HTMLInputElement;
    const seededPasswordInput = screen.getByLabelText("Contrasena temporal") as HTMLInputElement;

    expect(quickPasswordInput.type).toBe("password");
    expect(seededPasswordInput.type).toBe("password");

    const showButtons = screen.getAllByRole("button", { name: "Mostrar contrasena" });
    fireEvent.click(showButtons[0]);
    fireEvent.click(showButtons[1]);

    expect(quickPasswordInput.type).toBe("text");
    expect(seededPasswordInput.type).toBe("text");

    const hideButtons = screen.getAllByRole("button", { name: "Ocultar contrasena" });
    fireEvent.click(hideButtons[0]);
    fireEvent.click(hideButtons[1]);

    expect(quickPasswordInput.type).toBe("password");
    expect(seededPasswordInput.type).toBe("password");
  });

  it("submits payload and shows success confirmation", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, email: "qa.user@example.com" }),
    });

    render(<SuperadminDevTools {...baseProps} />);

    fireEvent.change(screen.getAllByLabelText("Correo")[1], { target: { value: "qa.user@example.com" } });
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "QA User" } });
    fireEvent.change(screen.getByLabelText("Contrasena temporal"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Rol asignado"), { target: { value: "parent" } });
    fireEvent.change(screen.getByLabelText("Estatus de aprobacion"), { target: { value: "pending" } });
    fireEvent.change(screen.getByLabelText("Idioma preferido"), { target: { value: "en-US" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Crear" })[1]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/email-users",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
          body: JSON.stringify({
            email: "qa.user@example.com",
            fullName: "QA User",
            password: "password123",
            assignedRole: "parent",
            approvalStatus: "pending",
            preferredLocale: "en-US",
          }),
        })
      );
    });

    expect(screen.getByText("Cuenta sembrada creada para qa.user@example.com.")).toBeInTheDocument();
  });

  it("shows specific duplicate-email message when backend returns the reason", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, reason: "email-already-exists" }),
    });

    render(<SuperadminDevTools {...baseProps} />);

    fireEvent.change(screen.getAllByLabelText("Correo")[1], { target: { value: "qa.user@example.com" } });
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "QA User" } });
    fireEvent.change(screen.getByLabelText("Contrasena temporal"), { target: { value: "password123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Crear" })[1]);

    await waitFor(() => {
      expect(screen.getByText("Ese correo ya existe. Usa otro correo o elimina la cuenta previa.")).toBeInTheDocument();
    });
  });
});
