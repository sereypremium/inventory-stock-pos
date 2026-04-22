import type { SaleDetailView } from '../services/salesService';
import type { ShopSettings } from '../types/models';
import { format_currency, format_date_time, format_number } from './formatters';

export function build_receipt_html(
  detail: SaleDetailView,
  settings: ShopSettings,
) {
  const items_html = detail.items
    .map(
      (item) => `
        <div class="item">
          <div><strong>${item.model_name}</strong></div>
          <div class="muted">${item.size} / ${item.color}</div>
          <div class="row">
            <span class="muted">${format_number(item.qty)} x ${format_currency(item.sale_price, settings.currency)}</span>
            <span class="muted">${format_currency(item.line_total, settings.currency)}</span>
          </div>
        </div>
      `,
    )
    .join('');

  return `
    <div class="receipt">
      <div class="center">
        <div><strong>${settings.shop_name}</strong></div>
        <div class="muted">${settings.address}</div>
        <div class="muted">${settings.phone}</div>
      </div>
      <hr />
      <div class="muted">Receipt No: ${detail.header.sale_no}</div>
      <div class="muted">Date: ${format_date_time(detail.header.sale_date)}</div>
      <div class="muted">Cashier: ${detail.cashier_name}</div>
      <div class="muted">Customer: ${detail.customer_name || 'Walk-in'}</div>
      <hr />
      ${items_html}
      <hr />
      <div class="row"><span>Subtotal</span><span>${format_currency(detail.header.subtotal, settings.currency)}</span></div>
      <div class="row"><span>Discount</span><span>${format_currency(detail.header.discount_amount, settings.currency)}</span></div>
      <div class="row"><strong>Total</strong><strong>${format_currency(detail.header.total_amount, settings.currency)}</strong></div>
      <div class="row"><span>Paid</span><span>${format_currency(detail.header.paid_amount, settings.currency)}</span></div>
      <div class="row"><span>Change</span><span>${format_currency(detail.header.change_amount, settings.currency)}</span></div>
      <hr />
      <div class="center muted">${settings.receipt_footer}</div>
    </div>
  `;
}
