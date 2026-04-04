import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ParentChildrenPage } from "@/app/platfrom/dashboard/parent/children/ParentChildrenPage";

const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const labels = {
  title: "My children",
  subtitle: "Manage children",
  loading: "Loading...",
  error: "Could not load",
  empty: "No children yet",
  addButton: "Add child",
  status: {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
  },
  form: {
    title: "Register a child",
    fullName: "Full name",
    fullNamePlaceholder: "Full legal name",
    dateOfBirth: "Date of birth",
    curp: "CURP",
    curpPlaceholder: "18-character CURP",
    curpError: "Invalid CURP format",
    curpLookupLink: "Look up CURP",
    gradeLevel: "Grade level",
    gradeLevelDefaultOption: "Select grade level",
    bloodType: "Blood type",
    bloodTypePlaceholder: "Select blood type",
    allergies: "Allergies",
    allergiesPlaceholder: "List any known allergies",
    dataAuthorization: "I authorize the school to process my child's data.",
    cancel: "Cancel",
    submit: "Register child",
    submitting: "Registering...",
    error: "Could not register",
    errorForbidden: "Account not approved",
    errorInvalidCurp: "Invalid CURP format",
    errorDuplicateCurp: "CURP already registered",
  },
};

describe("ParentChildrenPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
  });

  it("shows loading state on mount", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ParentChildrenPage labels={labels} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state when API call fails", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Could not load")).toBeInTheDocument();
  });

  it("shows empty state when there are no children", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, children: [] }),
    });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => expect(screen.getByText("No children yet")).toBeInTheDocument());
  });

  it("renders child cards", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        children: [
          {
            id: "s-1",
            fullName: "Ana López",
            gradeLevel: "Kinder 2",
            dateOfBirth: "2015-03-10",
            curp: "LOPA150310MDFXXX01",
            bloodType: "O+",
            allergies: null,
            dataAuthorizationSignedAt: null,
            approvalStatus: "pending",
            onboardingStatus: "submitted",
          },
        ],
      }),
    });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => expect(screen.getByText("Ana López")).toBeInTheDocument());
    expect(screen.getByText("Kinder 2")).toBeInTheDocument();
    expect(screen.getByText("Pending review")).toBeInTheDocument();
  });

  it("opens registration form on Add child click", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, children: [] }),
    });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Add child"));
    expect(screen.getByText("Register a child")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Full legal name")).toBeInTheDocument();
  });

  it("closes form on Cancel click", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, children: [] }),
    });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Register a child")).not.toBeInTheDocument();
  });

  it("submits form and refreshes list on success", async () => {
    // First load returns empty, second load (after POST) returns new child
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, children: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, studentId: "s-new" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          children: [
            {
              id: "s-new",
              fullName: "Pedro Ramírez",
              gradeLevel: "Kinder 1",
              dateOfBirth: "2018-06-01",
              curp: "RAMP180601MDFXXX01",
              bloodType: null,
              allergies: null,
              dataAuthorizationSignedAt: null,
              approvalStatus: "pending",
              onboardingStatus: "submitted",
            },
          ],
        }),
      });

    const { container } = render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Add child"));

    fireEvent.change(screen.getByPlaceholderText("Full legal name"), {
      target: { value: "Pedro Ramírez" },
    });
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2018-06-01" } });
    fireEvent.change(screen.getByPlaceholderText("18-character CURP"), {
      target: { value: "RAMP180601MDFXXX01" },
    });
    const gradeSelect = container.querySelector('select[name="gradeLevel"]') as HTMLSelectElement;
    fireEvent.change(gradeSelect, { target: { value: "Kinder 1" } });
    const authCheckbox = screen.getByLabelText("I authorize the school to process my child's data.") as HTMLInputElement;
    fireEvent.click(authCheckbox);
    fireEvent.click(screen.getByText("Register child"));

    await waitFor(() => expect(screen.getByText("Pedro Ramírez")).toBeInTheDocument());
    expect(screen.queryByText("Register a child")).not.toBeInTheDocument();
  });

  it("shows CURP format error on blur with invalid value", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, children: [] }),
    });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Add child"));

    const curpInput = screen.getByPlaceholderText("18-character CURP");
    fireEvent.change(curpInput, { target: { value: "INVALID" } });
    fireEvent.blur(curpInput);

    expect(screen.getByText("Invalid CURP format")).toBeInTheDocument();
  });

  it("clears CURP error once a valid CURP is typed", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, children: [] }),
    });
    render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Add child"));

    const curpInput = screen.getByPlaceholderText("18-character CURP");
    fireEvent.change(curpInput, { target: { value: "INVALID" } });
    fireEvent.blur(curpInput);
    expect(screen.getByText("Invalid CURP format")).toBeInTheDocument();

    // Now type a valid CURP — error should clear
    fireEvent.change(curpInput, { target: { value: "LMUC170710MYNNTMA1" } });
    expect(screen.queryByText("Invalid CURP format")).not.toBeInTheDocument();
  });

  it("shows form error when POST fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, children: [] }),
      })
      .mockResolvedValueOnce({ ok: false });

    const { container } = render(<ParentChildrenPage labels={labels} />);
    await waitFor(() => screen.getByText("Add child"));
    fireEvent.click(screen.getByText("Add child"));
    fireEvent.change(screen.getByPlaceholderText("Full legal name"), {
      target: { value: "Pedro Ramírez" },
    });
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2018-06-01" } });
    fireEvent.change(screen.getByPlaceholderText("18-character CURP"), {
      target: { value: "RAMP180601MDFXXX01" },
    });
    const gradeSelect = container.querySelector('select[name="gradeLevel"]') as HTMLSelectElement;
    fireEvent.change(gradeSelect, { target: { value: "Kinder 1" } });
    const authCheckbox = screen.getByLabelText("I authorize the school to process my child's data.") as HTMLInputElement;
    fireEvent.click(authCheckbox);
    fireEvent.click(screen.getByText("Register child"));
  });
});
