import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// Mock the db module
vi.mock("./db", () => ({
  getIncomes: vi.fn().mockResolvedValue([
    { id: 1, description: "Salário", amount: "5000.00", date: "2026-03-01", categoryId: null, isRecurring: false },
  ]),
  getExpenses: vi.fn().mockResolvedValue([
    { id: 1, description: "Supermercado", amount: "350.00", date: "2026-03-05", categoryId: null, isRecurring: false },
  ]),
  getCreditCardTransactions: vi.fn().mockResolvedValue([
    { id: 1, description: "Restaurante", amount: "120.00", date: "2026-03-10", creditCardId: 1, invoiceMonth: "2026-03", installmentNumber: null },
  ]),
  getMonthlySummary: vi.fn().mockResolvedValue({
    totalIncome: 5000,
    totalExpenses: 350,
    totalCreditCard: 120,
    balance: 4530,
  }),
  getIncomeCategories: vi.fn().mockResolvedValue([]),
  getExpenseCategories: vi.fn().mockResolvedValue([]),
  getCreditCards: vi.fn().mockResolvedValue([{ id: 1, name: "Nubank" }]),
}));

// Mock the SDK authentication
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn().mockResolvedValue({ id: 1, openId: "test-user", name: "Test User" }),
  },
}));

function createMockReq(query: Record<string, string> = {}): Partial<Request> {
  return {
    query,
    headers: { cookie: "session=mock-token" },
  };
}

function createMockRes(): { res: Partial<Response>; headers: Record<string, string>; chunks: Buffer[] } {
  const headers: Record<string, string> = {};
  const chunks: Buffer[] = [];
  const res: Partial<Response> = {
    setHeader: vi.fn((key: string, value: string) => { headers[key] = value; return res as Response; }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn((data: Buffer) => { chunks.push(data); return res as Response; }),
    end: vi.fn(),
    write: vi.fn(),
  };
  return { res, headers, chunks };
}

describe("export routes", () => {
  describe("exportExcel", () => {
    it("returns 400 when month param is missing", async () => {
      const { exportExcel } = await import("./export");
      const req = createMockReq({});
      const { res } = createMockRes();
      await exportExcel(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it("returns 400 when month format is invalid", async () => {
      const { exportExcel } = await import("./export");
      const req = createMockReq({ month: "2026/03" });
      const { res } = createMockRes();
      await exportExcel(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("sets correct content-type for valid month", async () => {
      const { exportExcel } = await import("./export");
      const req = createMockReq({ month: "2026-03" });
      const { res, headers } = createMockRes();
      await exportExcel(req as Request, res as Response);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    });

    it("sets correct content-disposition filename", async () => {
      const { exportExcel } = await import("./export");
      const req = createMockReq({ month: "2026-03" });
      const { res } = createMockRes();
      await exportExcel(req as Request, res as Response);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="meu-ganho-pessoal-2026-03.xlsx"'
      );
    });
  });

  describe("exportPdf", () => {
    it("returns 400 when month param is missing", async () => {
      const { exportPdf } = await import("./export");
      const req = createMockReq({});
      const { res } = createMockRes();
      await exportPdf(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when month format is invalid", async () => {
      const { exportPdf } = await import("./export");
      const req = createMockReq({ month: "March-2026" });
      const { res } = createMockRes();
      await exportPdf(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("sets correct content-type for valid month", async () => {
      const { exportPdf } = await import("./export");
      const req = createMockReq({ month: "2026-03" });
      const { res } = createMockRes();
      await exportPdf(req as Request, res as Response);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    });

    it("sets correct content-disposition filename", async () => {
      const { exportPdf } = await import("./export");
      const req = createMockReq({ month: "2026-03" });
      const { res } = createMockRes();
      await exportPdf(req as Request, res as Response);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="meu-ganho-pessoal-2026-03.pdf"'
      );
    });

    it("sends a non-empty PDF buffer", async () => {
      const { exportPdf } = await import("./export");
      const req = createMockReq({ month: "2026-03" });
      const { res, chunks } = createMockRes();
      await exportPdf(req as Request, res as Response);
      expect(res.send).toHaveBeenCalled();
      const sentBuffer = (res.send as any).mock.calls[0][0] as Buffer;
      expect(sentBuffer.length).toBeGreaterThan(100);
    });
  });
});
