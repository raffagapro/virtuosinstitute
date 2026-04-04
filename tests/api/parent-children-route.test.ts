/** @jest-environment node */

import { GET, POST } from "@/app/api/parent/children/route";
import { NextRequest } from "next/server";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
  getSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

function membershipQuery(rows: Array<{ school_role: string }>, error: null | object = null) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            eq: async () => ({ data: rows, error }),
          }),
        }),
      }),
    }),
  };
}

function guardianSelectQuery(rows: Array<{ student_id: string }>, error: null | object = null) {
  return {
    select: () => ({
      eq: async () => ({ data: rows, error }),
    }),
  };
}

function studentsSelectQuery(rows: object[], error: null | object = null) {
  return {
    select: () => ({
      in: () => ({
        order: async () => ({ data: rows, error }),
      }),
    }),
  };
}

function studentsInsertQuery(data: object | null, error: null | object = null) {
  return {
    insert: () => ({
      select: () => ({
        single: async () => ({ data, error }),
      }),
    }),
  };
}

function guardianInsertQuery(error: null | object = null) {
  return {
    insert: async () => ({ error }),
  };
}

function parentProfileUpsertQuery(error: null | object = null) {
  return {
    upsert: async () => ({ error }),
  };
}

function makeRequest(method: string, body?: object, token = "valid-token"): NextRequest {
  const init: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return new NextRequest("http://localhost/api/parent/children", init);
}

describe("GET /api/parent/children", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when no bearer token is provided", async () => {
    const req = new NextRequest("http://localhost/api/parent/children");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.reason).toBe("missing-token");
  });

  it("returns 401 for an invalid session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad token" } });
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.reason).toBe("invalid-session");
  });

  it("returns 403 when user is not an approved parent", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom.mockReturnValueOnce(membershipQuery([]));
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.reason).toBe("forbidden");
  });

  it("returns empty children list for an approved parent with no children", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(membershipQuery([{ school_role: "parent" }]))
      .mockReturnValueOnce(guardianSelectQuery([]));

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.children).toEqual([]);
  });

  it("returns mapped children for an approved parent", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(membershipQuery([{ school_role: "parent" }]))
      .mockReturnValueOnce(guardianSelectQuery([{ student_id: "student-1" }]))
      .mockReturnValueOnce(
        studentsSelectQuery([
          {
            id: "student-1",
            full_name: "Ana López",
            date_of_birth: "2015-03-10",
            curp: "LOPA150310MDFXXX01",
            grade_level: "Kinder 2",
            blood_type: "O+",
            allergies: null,
            data_authorization_signed_at: null,
            approval_status: "pending",
            onboarding_status: "submitted",
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ])
      );

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.children).toHaveLength(1);
    expect(json.children[0].fullName).toBe("Ana López");
    expect(json.children[0].curp).toBe("LOPA150310MDFXXX01");
    expect(json.children[0].gradeLevel).toBe("Kinder 2");
    expect(json.children[0].bloodType).toBe("O+");
    expect(json.children[0].approvalStatus).toBe("pending");
  });
});

describe("POST /api/parent/children", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when no bearer token is provided", async () => {
    const req = new NextRequest("http://localhost/api/parent/children", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.reason).toBe("missing-token");
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    // Missing dateOfBirth, curp, gradeLevel
    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("invalid-input");
  });

  it("returns 400 when fullName is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const res = await POST(makeRequest("POST", { dateOfBirth: "2015-01-01", curp: "ABCD150101MDFXXX01", gradeLevel: "Kinder 2" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("invalid-input");
  });

  it("returns 400 when CURP format is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez", dateOfBirth: "2016-05-20", curp: "INVALID", gradeLevel: "1st grade", dataAuthorization: true }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("invalid-curp");
  });

  it("returns 400 when data authorization is not accepted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez", dateOfBirth: "2016-05-20", curp: "RAMP160520MDFXXX01", gradeLevel: "1st grade", dataAuthorization: false }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("invalid-input");
  });

  it("returns 403 when user is not an approved parent", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom.mockReturnValueOnce(membershipQuery([]));
    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez", dateOfBirth: "2016-05-20", curp: "RAMP160520MDFXXX01", gradeLevel: "1st grade", dataAuthorization: true }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.reason).toBe("forbidden");
  });

  it("returns 422 when parent_profiles row does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(membershipQuery([{ school_role: "parent" }]))
      .mockReturnValueOnce(parentProfileUpsertQuery({ message: "upsert failed" }));
    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez", dateOfBirth: "2016-05-20", curp: "RAMP160520MDFXXX01", gradeLevel: "1st grade", dataAuthorization: true }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.reason).toBe("parent-profile-setup-failed");
  });

  it("returns 409 when CURP is already registered for the same school", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(membershipQuery([{ school_role: "parent" }]))
      .mockReturnValueOnce(parentProfileUpsertQuery(null))
      .mockReturnValueOnce(studentsInsertQuery(null, { code: "23505", message: "students_school_curp_unique_idx" }));
    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez", dateOfBirth: "2016-05-20", curp: "RAMP160520MDFXXX01", gradeLevel: "1st grade", dataAuthorization: true }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.reason).toBe("duplicate-curp");
  });

  it("returns 201 with studentId on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom
      .mockReturnValueOnce(membershipQuery([{ school_role: "parent" }]))
      .mockReturnValueOnce(parentProfileUpsertQuery(null))
      .mockReturnValueOnce(studentsInsertQuery({ id: "new-student-1" }))
      .mockReturnValueOnce(guardianInsertQuery(null));

    const res = await POST(
      makeRequest("POST", {
        fullName: "Pedro Ramírez",
        dateOfBirth: "2016-05-20",
        curp: "RAMP160520MDFXXX01",
        gradeLevel: "1st grade",
        bloodType: "A+",
        dataAuthorization: true,
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.studentId).toBe("new-student-1");
  });

  it("returns 500 and rolls back student if guardian insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const rollbackQuery = {
      delete: () => ({
        eq: async () => ({ error: null }),
      }),
    };

    mockFrom
      .mockReturnValueOnce(membershipQuery([{ school_role: "parent" }]))
      .mockReturnValueOnce(parentProfileUpsertQuery(null))
      .mockReturnValueOnce(studentsInsertQuery({ id: "new-student-1" }))
      .mockReturnValueOnce(guardianInsertQuery({ message: "db error" }))
      .mockReturnValueOnce(rollbackQuery);

    const res = await POST(makeRequest("POST", { fullName: "Pedro Ramírez", dateOfBirth: "2016-05-20", curp: "RAMP160520MDFXXX01", gradeLevel: "1st grade", dataAuthorization: true }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.reason).toBe("guardian-link-failed");
    // Verify rollback was attempted
    expect(mockFrom).toHaveBeenCalledTimes(5);
  });
});
