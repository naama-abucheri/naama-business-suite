import type { CompanyProfile } from "@/hooks/use-company-profile";

export interface DocumentLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PrintableDocument {
  type: "RECEIPT" | "QUOTATION" | "INVOICE";
  number?: string;
  date: string;
  due_date?: string | null;
  status?: string;
  bill_to: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  items: DocumentLineItem[];
  notes?: string | null;
  footer_message?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildDocumentHTML(doc: PrintableDocument, company: CompanyProfile | null): string {
  const subtotal = doc.items.reduce((s, i) => s + Number(i.total || 0), 0);

  const companyName = company?.company_name ?? "Your Company";
  const companyEmail = company?.email ?? "";
  const companyPhone = company?.phone ?? "";
  const companyAddress = company?.address ?? "";
  const logo = company?.logo_url
    ? `<img src="${escapeHtml(company.logo_url)}" alt="logo" style="max-height:72px;max-width:160px;object-fit:contain;" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:#5A0F1C;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:28px;font-weight:bold;">${escapeHtml(companyName.charAt(0).toUpperCase())}</div>`;

  const itemsRows = doc.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">${escapeHtml(i.description)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">$${Number(i.unit_price).toFixed(2)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">$${Number(i.total).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const accent = "#5A0F1C";
  const muted = "#666";

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${doc.type} ${doc.number ?? ""}</title>
<style>
  @media print { @page { margin: 0.5in; } }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color:#1a1a1a; max-width:800px; margin:0 auto; padding:32px; background:#fff; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:24px; border-bottom:3px solid ${accent}; }
  .company { display:flex; gap:16px; align-items:center; }
  .company-info h1 { margin:0; font-family:Georgia,serif; font-size:24px; color:${accent}; }
  .company-info p { margin:2px 0; font-size:12px; color:${muted}; }
  .doc-title { text-align:right; }
  .doc-title h2 { margin:0; font-family:Georgia,serif; font-size:32px; color:${accent}; letter-spacing:2px; }
  .doc-title p { margin:4px 0; font-size:12px; color:${muted}; }
  .meta { display:flex; justify-content:space-between; margin-top:24px; gap:32px; }
  .meta-block h3 { margin:0 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${muted}; }
  .meta-block p { margin:2px 0; font-size:13px; }
  table { width:100%; border-collapse:collapse; margin-top:24px; }
  thead { background:${accent}; color:#fff; }
  thead th { padding:10px 8px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
  thead th.right { text-align:right; }
  thead th.center { text-align:center; }
  .totals { margin-top:16px; display:flex; justify-content:flex-end; }
  .totals-table { width:280px; }
  .totals-table tr td { padding:6px 8px; font-size:13px; }
  .totals-table .total-row td { font-weight:bold; font-size:16px; border-top:2px solid ${accent}; padding-top:10px; color:${accent}; }
  .notes { margin-top:24px; padding:16px; background:#faf6f7; border-left:3px solid ${accent}; font-size:12px; color:${muted}; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #eee; text-align:center; font-size:11px; color:${muted}; }
  .badge { display:inline-block; padding:4px 10px; border-radius:12px; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; font-weight:bold; }
  .badge-paid { background:#e6f7ec; color:#1a7f3c; }
  .badge-unpaid { background:#fdecec; color:#c0392b; }
</style></head><body>
  <div class="header">
    <div class="company">
      ${logo}
      <div class="company-info">
        <h1>${escapeHtml(companyName)}</h1>
        ${companyAddress ? `<p>${escapeHtml(companyAddress)}</p>` : ""}
        ${companyPhone ? `<p>📞 ${escapeHtml(companyPhone)}</p>` : ""}
        ${companyEmail ? `<p>✉ ${escapeHtml(companyEmail)}</p>` : ""}
      </div>
    </div>
    <div class="doc-title">
      <h2>${doc.type}</h2>
      ${doc.number ? `<p># ${escapeHtml(doc.number)}</p>` : ""}
      <p>Date: ${escapeHtml(doc.date)}</p>
      ${doc.due_date ? `<p>Due: ${escapeHtml(doc.due_date)}</p>` : ""}
      ${doc.status ? `<p><span class="badge ${doc.status === "paid" ? "badge-paid" : "badge-unpaid"}">${escapeHtml(doc.status)}</span></p>` : ""}
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h3>Bill To</h3>
      <p style="font-weight:bold;font-size:14px;">${escapeHtml(doc.bill_to.name)}</p>
      ${doc.bill_to.address ? `<p>${escapeHtml(doc.bill_to.address)}</p>` : ""}
      ${doc.bill_to.phone ? `<p>${escapeHtml(doc.bill_to.phone)}</p>` : ""}
      ${doc.bill_to.email ? `<p>${escapeHtml(doc.bill_to.email)}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td>Subtotal:</td><td style="text-align:right;">$${subtotal.toFixed(2)}</td></tr>
      <tr class="total-row"><td>TOTAL:</td><td style="text-align:right;">$${subtotal.toFixed(2)}</td></tr>
    </table>
  </div>

  ${doc.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(doc.notes)}</div>` : ""}

  <div class="footer">
    ${doc.footer_message ?? "Thank you for your business!"}
  </div>
</body></html>`;
}

export function printDocument(doc: PrintableDocument, company: CompanyProfile | null) {
  const html = buildDocumentHTML(doc, company);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
