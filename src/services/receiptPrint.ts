import { formatCurrency, formatDateTime } from '../lib/formatters';
import { mockSystemSettings } from '../data/mockData';
import { getSaleDiscountAmount, getSaleGrandTotal } from './salesService';
import type { PaymentMethod, SaleRecord, SystemSettings } from '../types/models';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatPaymentMethod(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case 'cash':
      return 'Cash';
    case 'card':
      return 'Card';
    case 'transfer':
      return 'Transfer';
    default:
      return paymentMethod;
  }
}

export function buildSaleReceiptHtml(
  record: SaleRecord,
  settings: SystemSettings = mockSystemSettings,
) {
  const discountAmount = getSaleDiscountAmount(record);
  const grandTotal = getSaleGrandTotal(record);
  const itemsHtml = record.items
    .map(
      (item) => `
        <div class="line-item">
          <div class="line-top">
            <span>${escapeHtml(item.productName)}</span>
            <span>${escapeHtml(formatCurrency(item.lineTotal))}</span>
          </div>
          <div class="line-bottom">
            ${escapeHtml(item.variantSku)} | ${escapeHtml(item.size)} / ${escapeHtml(item.color)} | ${escapeHtml(String(item.quantity))} x ${escapeHtml(formatCurrency(item.unitPrice))}
          </div>
        </div>
      `,
    )
    .join('');

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(record.receiptNo)}</title>
      <style>
        body {
          font-family: Consolas, "Courier New", monospace;
          margin: 0;
          padding: 16px;
          color: #111827;
          background: #ffffff;
        }
        .receipt {
          max-width: 340px;
          margin: 0 auto;
        }
        .center { text-align: center; }
        .muted { color: #4b5563; font-size: 12px; }
        .strong { font-weight: 700; }
        .divider {
          border-top: 1px dashed #9ca3af;
          margin: 12px 0;
        }
        .row, .line-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .line-item { margin-bottom: 10px; }
        .line-bottom {
          color: #4b5563;
          font-size: 12px;
          margin-top: 2px;
        }
        @media print {
          body { padding: 0; }
          .receipt { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="center">
          <div class="strong">${escapeHtml(settings.storeName)}</div>
          <div class="muted">${escapeHtml(settings.branchName)}</div>
          <div class="muted">${escapeHtml(settings.address)}</div>
          <div class="muted">${escapeHtml(settings.phone)}</div>
          <div class="muted">${escapeHtml(record.receiptNo)}</div>
        </div>
        <div class="divider"></div>
        <div class="muted">Date: ${escapeHtml(formatDateTime(record.soldAt))}</div>
        <div class="muted">Cashier: ${escapeHtml(record.cashierName)}</div>
        ${
          record.customerName
            ? `<div class="muted">Customer: ${escapeHtml(record.customerName)}</div>`
            : ''
        }
        <div class="muted">Payment: ${escapeHtml(formatPaymentMethod(record.paymentMethod))}</div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row"><span>Items</span><span>${escapeHtml(String(record.totalQuantity))}</span></div>
        <div class="row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(record.subtotal))}</span></div>
        ${
          discountAmount > 0
            ? `<div class="row"><span>Discount</span><span>${escapeHtml(formatCurrency(discountAmount))}</span></div>`
            : ''
        }
        <div class="row strong"><span>Total</span><span>${escapeHtml(formatCurrency(grandTotal))}</span></div>
        <div class="row"><span>Paid</span><span>${escapeHtml(formatCurrency(record.paidAmount))}</span></div>
        <div class="row"><span>Change</span><span>${escapeHtml(formatCurrency(record.changeAmount))}</span></div>
        ${
          record.note
            ? `<div class="divider"></div><div class="muted">Note: ${escapeHtml(record.note)}</div>`
            : ''
        }
        <div class="divider"></div>
        <div class="center muted">${escapeHtml(settings.receiptFooter || 'Thank you for your purchase.')}</div>
      </div>
    </body>
  </html>`;
}

export function printSaleReceipt(
  record: SaleRecord,
  settings: SystemSettings = mockSystemSettings,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=420,height=720');

  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildSaleReceiptHtml(record, settings));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 150);
}
