import type { DigestData } from "./digest";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sectionTable(title: string, headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "";
  const th = headers
    .map(
      (h) =>
        `<th style="text-align:left;padding:6px 10px;border-bottom:1px solid #ddd;font:600 12px system-ui,sans-serif;color:#666;">${escapeHtml(h)}</th>`,
    )
    .join("");
  const tr = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding:6px 10px;border-bottom:1px solid #eee;font:14px system-ui,sans-serif;color:#333;">${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `
    <tr><td style="padding:24px 0 8px;">
      <div style="font:600 15px system-ui,sans-serif;color:#111;">${escapeHtml(title)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
        <tr>${th}</tr>
        ${tr}
      </table>
    </td></tr>`;
}

export function renderDigestEmailHtml(data: DigestData, dateLabel: string): string {
  const sections =
    sectionTable(
      "Red · under 4 weeks",
      ["Brand", "Space", "Weeks left", "Ends", "Renewal", "Owner"],
      data.red.map((r) => [r.brand, r.space, r.weeksLabel, r.endDate, r.renewalStatus, r.owner]),
    ) +
    sectionTable(
      "Amber · 4 to 8 weeks",
      ["Brand", "Space", "Weeks left", "Ends", "Renewal", "Owner"],
      data.amber.map((r) => [r.brand, r.space, r.weeksLabel, r.endDate, r.renewalStatus, r.owner]),
    ) +
    sectionTable(
      "Prospects wanting to join within 30 days",
      ["Name", "Requested date", "Requested space"],
      data.joining.map((r) => [r.name, r.requestedDate, r.requestedSpace]),
    ) +
    sectionTable(
      "Gone quiet · 21+ days",
      ["Name", "Phone", "Days since contact"],
      data.quiet.map((r) => [r.name, r.phone, String(r.daysSince)]),
    );

  const body =
    sections ||
    `<tr><td style="padding:24px 0;font:14px system-ui,sans-serif;color:#333;">Nothing needs attention today.</td></tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e5e5;">
      <tr><td style="font:700 18px system-ui,sans-serif;color:#111;">Lanes daily digest · ${escapeHtml(dateLabel)}</td></tr>
      ${body}
    </table>
  </body>
</html>`;
}
