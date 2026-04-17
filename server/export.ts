import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { sdk } from "./_core/sdk";
import {
  getIncomes,
  getExpenses,
  getCreditCardTransactions,
  getMonthlySummary,
  getIncomeCategories,
  getExpenseCategories,
  getCreditCards,
} from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = (dateStr as string).split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function monthFullLabel(month: string): string {
  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const [year, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${year}`;
}

async function authenticate(req: Request): Promise<number | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    return user.id;
  } catch {
    return null;
  }
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export async function exportExcel(req: Request, res: Response) {
  const userId = await authenticate(req);
  if (!userId) return res.status(401).json({ error: "Não autorizado" });

  const month = (req.query.month as string) || "";
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Parâmetro month inválido. Use YYYY-MM." });
  }

  const [incomeRows, expenseRows, ccRows, summary, incCats, expCats, cards] = await Promise.all([
    getIncomes(userId, month),
    getExpenses(userId, month),
    getCreditCardTransactions(userId, month),
    getMonthlySummary(userId, month),
    getIncomeCategories(userId),
    getExpenseCategories(userId),
    getCreditCards(userId),
  ]);

  const incCatMap = new Map(incCats.map((c) => [c.id, c.name]));
  const expCatMap = new Map(expCats.map((c) => [c.id, c.name]));
  const cardMap = new Map(cards.map((c) => [c.id, c.name]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Meu Ganho Pessoal";
  workbook.created = new Date();

  // ── Styles ──────────────────────────────────────────────────────────────────
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" }, // indigo-600
  };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const positiveFont: Partial<ExcelJS.Font> = { color: { argb: "FF059669" }, bold: true }; // emerald-600
  const negativeFont: Partial<ExcelJS.Font> = { color: { argb: "FFEF4444" }, bold: true }; // red-500
  const neutralFont: Partial<ExcelJS.Font> = { color: { argb: "FF6366F1" }, bold: true }; // indigo-500
  const currencyFmt = 'R$ #,##0.00';

  function styleHeader(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
    row.height = 28;
  }

  function autoWidth(sheet: ExcelJS.Worksheet, minWidth = 12) {
    sheet.columns.forEach((col) => {
      let max = minWidth;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 4, 50);
    });
  }

  // ── Sheet 1: Resumo ─────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.mergeCells("A1:B1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = `Extrato Financeiro — ${monthFullLabel(month)}`;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
  titleCell.alignment = { horizontal: "center" };
  summarySheet.getRow(1).height = 32;

  summarySheet.addRow([]);
  const summaryHeader = summarySheet.addRow(["Categoria", "Valor"]);
  styleHeader(summaryHeader);

  const summaryData = [
    ["Total de Receitas", summary.totalIncome],
    ["Total de Despesas", summary.totalExpenses],
    ["Total Cartão de Crédito", summary.totalCreditCard],
    ["Saldo do Mês", summary.balance],
  ];

  summaryData.forEach(([label, value]) => {
    const row = summarySheet.addRow([label, value as number]);
    row.getCell(2).numFmt = currencyFmt;
    const isBalance = label === "Saldo do Mês";
    if (isBalance) {
      row.getCell(2).font = (value as number) >= 0 ? positiveFont : negativeFont;
    } else if (label === "Total de Receitas") {
      row.getCell(2).font = positiveFont;
    } else {
      row.getCell(2).font = negativeFont;
    }
    row.height = 22;
  });

  autoWidth(summarySheet);

  // ── Sheet 2: Receitas ────────────────────────────────────────────────────────
  const incomeSheet = workbook.addWorksheet("Receitas");
  const incomeHeader = incomeSheet.addRow(["Data", "Descrição", "Categoria", "Recorrente", "Valor"]);
  styleHeader(incomeHeader);
  incomeSheet.getColumn(5).numFmt = currencyFmt;

  incomeRows.forEach((r) => {
    const row = incomeSheet.addRow([
      formatDate(r.date as unknown as string),
      r.description,
      r.categoryId ? (incCatMap.get(r.categoryId) ?? "—") : "Sem categoria",
      r.isRecurring ? "Sim" : "Não",
      parseFloat(r.amount as unknown as string),
    ]);
    row.getCell(5).font = positiveFont;
    row.height = 20;
  });

  if (incomeRows.length === 0) {
    incomeSheet.addRow(["Nenhuma receita registrada neste mês", "", "", "", ""]);
  }

  autoWidth(incomeSheet);

  // ── Sheet 3: Despesas ────────────────────────────────────────────────────────
  const expenseSheet = workbook.addWorksheet("Despesas");
  const expenseHeader = expenseSheet.addRow(["Data", "Descrição", "Categoria", "Recorrente", "Valor"]);
  styleHeader(expenseHeader);
  expenseSheet.getColumn(5).numFmt = currencyFmt;

  expenseRows.forEach((r) => {
    const row = expenseSheet.addRow([
      formatDate(r.date as unknown as string),
      r.description,
      r.categoryId ? (expCatMap.get(r.categoryId) ?? "—") : "Sem categoria",
      r.isRecurring ? "Sim" : "Não",
      parseFloat(r.amount as unknown as string),
    ]);
    row.getCell(5).font = negativeFont;
    row.height = 20;
  });

  if (expenseRows.length === 0) {
    expenseSheet.addRow(["Nenhuma despesa registrada neste mês", "", "", "", ""]);
  }

  autoWidth(expenseSheet);

  // ── Sheet 4: Cartão de Crédito ───────────────────────────────────────────────
  const ccSheet = workbook.addWorksheet("Cartão de Crédito");
  const ccHeader = ccSheet.addRow(["Data", "Cartão", "Descrição", "Parcela", "Valor"]);
  styleHeader(ccHeader);
  ccSheet.getColumn(5).numFmt = currencyFmt;

  ccRows.forEach((r) => {
    const row = ccSheet.addRow([
      formatDate(r.date as unknown as string),
      cardMap.get(r.creditCardId) ?? "—",
      r.description,
      r.installmentNumber ? `${r.installmentNumber}` : "—",
      parseFloat(r.amount as unknown as string),
    ]);
    row.getCell(5).font = neutralFont;
    row.height = 20;
  });

  if (ccRows.length === 0) {
    ccSheet.addRow(["Nenhum lançamento de cartão neste mês", "", "", "", ""]);
  }

  autoWidth(ccSheet);

  // ── Send response ────────────────────────────────────────────────────────────
  const filename = `meu-ganho-pessoal-${month}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export async function exportPdf(req: Request, res: Response) {
  const userId = await authenticate(req);
  if (!userId) return res.status(401).json({ error: "Não autorizado" });

  const month = (req.query.month as string) || "";
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Parâmetro month inválido. Use YYYY-MM." });
  }

  const [incomeRows, expenseRows, ccRows, summary, incCats, expCats, cards] = await Promise.all([
    getIncomes(userId, month),
    getExpenses(userId, month),
    getCreditCardTransactions(userId, month),
    getMonthlySummary(userId, month),
    getIncomeCategories(userId),
    getExpenseCategories(userId),
    getCreditCards(userId),
  ]);

  const incCatMap = new Map(incCats.map((c) => [c.id, c.name]));
  const expCatMap = new Map(expCats.map((c) => [c.id, c.name]));
  const cardMap = new Map(cards.map((c) => [c.id, c.name]));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Meu Ganho Pessoal", margin, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Extrato Financeiro — ${monthFullLabel(month)}`, margin, 21);

  let y = 36;

  // ── Summary Cards ────────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Mês", margin, y);
  y += 6;

  const cardW = (pageWidth - margin * 2 - 9) / 4;
  const cards4 = [
    { label: "Receitas", value: summary.totalIncome, color: [5, 150, 105] as [number, number, number] },
    { label: "Despesas", value: summary.totalExpenses, color: [239, 68, 68] as [number, number, number] },
    { label: "Cartão", value: summary.totalCreditCard, color: [99, 102, 241] as [number, number, number] },
    { label: "Saldo", value: summary.balance, color: summary.balance >= 0 ? [5, 150, 105] as [number, number, number] : [239, 68, 68] as [number, number, number] },
  ];

  cards4.forEach((card, i) => {
    const x = margin + i * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, 20, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardW, 20, 2, 2, "S");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + cardW / 2, y + 7, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...card.color);
    doc.text(formatBRL(card.value), x + cardW / 2, y + 15, { align: "center" });
  });

  y += 28;

  // ── Receitas Table ───────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Receitas", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Data", "Descrição", "Categoria", "Valor"]],
    body: incomeRows.length > 0
      ? incomeRows.map((r) => [
          formatDate(r.date as unknown as string),
          r.description,
          r.categoryId ? (incCatMap.get(r.categoryId) ?? "—") : "Sem categoria",
          formatBRL(parseFloat(r.amount as unknown as string)),
        ])
      : [["—", "Nenhuma receita neste mês", "—", "—"]],
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: { 3: { halign: "right", textColor: [5, 150, 105], fontStyle: "bold" } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Despesas Table ───────────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Despesas", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Data", "Descrição", "Categoria", "Valor"]],
    body: expenseRows.length > 0
      ? expenseRows.map((r) => [
          formatDate(r.date as unknown as string),
          r.description,
          r.categoryId ? (expCatMap.get(r.categoryId) ?? "—") : "Sem categoria",
          formatBRL(parseFloat(r.amount as unknown as string)),
        ])
      : [["—", "Nenhuma despesa neste mês", "—", "—"]],
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: { 3: { halign: "right", textColor: [239, 68, 68], fontStyle: "bold" } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Cartão de Crédito Table ──────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cartão de Crédito", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Data", "Cartão", "Descrição", "Parcela", "Valor"]],
    body: ccRows.length > 0
      ? ccRows.map((r) => [
          formatDate(r.date as unknown as string),
          cardMap.get(r.creditCardId) ?? "—",
          r.description,
          r.installmentNumber ? `${r.installmentNumber}` : "—",
          formatBRL(parseFloat(r.amount as unknown as string)),
        ])
      : [["—", "—", "Nenhum lançamento neste mês", "—", "—"]],
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: { 4: { halign: "right", textColor: [99, 102, 241], fontStyle: "bold" } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} — Meu Ganho Pessoal`,
      margin,
      pageH - 8
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageH - 8, { align: "right" });
  }

  // ── Send response ────────────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `meu-ganho-pessoal-${month}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
}
