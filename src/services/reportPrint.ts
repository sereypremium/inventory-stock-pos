import { mockSystemSettings } from '../data/mockData';
import { formatDateTime } from '../lib/formatters';
import type { SystemSettings } from '../types/models';

export interface PrintableReportColumn {
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface PrintableReportMetric {
  label: string;
  value: string;
}

export interface PrintableReportFilter {
  label: string;
  value: string;
}

export interface PrintableReportData {
  title: string;
  subtitle: string;
  filters: PrintableReportFilter[];
  metrics: PrintableReportMetric[];
  columns: PrintableReportColumn[];
  rows: string[][];
  emptyMessage: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildReportHtml(
  report: PrintableReportData,
  settings: SystemSettings = mockSystemSettings,
) {
  const headerFilters = report.filters
    .map(
      (filter) =>
        `<div class="filter"><span class="label">${escapeHtml(filter.label)}</span><span>${escapeHtml(filter.value)}</span></div>`,
    )
    .join('');

  const metricsHtml = report.metrics
    .map(
      (metric) =>
        `<div class="metric"><div class="label">${escapeHtml(metric.label)}</div><div class="value">${escapeHtml(metric.value)}</div></div>`,
    )
    .join('');

  const headHtml = report.columns
    .map(
      (column) =>
        `<th class="${escapeHtml(column.align ?? 'left')}">${escapeHtml(column.label)}</th>`,
    )
    .join('');

  const rowsHtml =
    report.rows.length > 0
      ? report.rows
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell, index) =>
                    `<td class="${escapeHtml(report.columns[index]?.align ?? 'left')}">${escapeHtml(cell)}</td>`,
                )
                .join('')}</tr>`,
          )
          .join('')
      : `<tr><td colspan="${report.columns.length}" class="center muted">${escapeHtml(report.emptyMessage)}</td></tr>`;

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(report.title)}</title>
      <style>
        body {
          font-family: "Public Sans", "Segoe UI", sans-serif;
          color: #15221d;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }
        .page {
          max-width: 1080px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 18px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .subtitle, .meta, .muted {
          color: #55635c;
          font-size: 12px;
        }
        .store {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .filters, .metrics {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          margin: 16px 0;
        }
        .filter, .metric {
          border: 1px solid #dbe1d7;
          border-radius: 8px;
          padding: 12px;
        }
        .label {
          color: #55635c;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th, td {
          border: 1px solid #dbe1d7;
          padding: 10px 12px;
          font-size: 12px;
          vertical-align: top;
        }
        th {
          background: #f8faf7;
          color: #55635c;
          font-weight: 600;
          text-align: left;
        }
        .right { text-align: right; }
        .center { text-align: center; }
        .footer {
          border-top: 1px dashed #dbe1d7;
          color: #55635c;
          font-size: 12px;
          margin-top: 20px;
          padding-top: 12px;
        }
        @media print {
          body {
            padding: 0;
          }
          .page {
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="store">${escapeHtml(settings.storeName)}</div>
          <div class="subtitle">${escapeHtml(settings.branchName)}</div>
          <div class="subtitle">${escapeHtml(settings.address)}</div>
          <div class="subtitle">${escapeHtml(settings.phone)}</div>
          <div class="title">${escapeHtml(report.title)}</div>
          <div class="subtitle">${escapeHtml(report.subtitle)}</div>
          <div class="meta">Generated ${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
        </div>
        <div class="filters">${headerFilters}</div>
        <div class="metrics">${metricsHtml}</div>
        <table>
          <thead>
            <tr>${headHtml}</tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">${escapeHtml(settings.reportFooter)}</div>
      </div>
    </body>
  </html>`;
}

export function printReport(
  report: PrintableReportData,
  settings: SystemSettings = mockSystemSettings,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=1200,height=800');

  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildReportHtml(report, settings));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 150);
}
