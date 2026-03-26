import { formatEGP } from '../utils/formatCurrency';

interface ReceiptData {
  bookingId: string;
  stationName: string;
  providerName: string;
  connectorType: string;
  date: string;
  kwhDelivered: number;
  providerCost: number;
  serviceFee: number;
  total: number;
  paymentMethod: string;
}

export const receiptService = {
  generateHTML(data: ReceiptData): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EV Charge Egypt Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #111827; }
    h1 { color: #10B981; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
    .total { font-weight: bold; font-size: 1.2em; color: #10B981; }
  </style>
</head>
<body>
  <h1>EV Charge Egypt</h1>
  <p>Receipt #${data.bookingId.slice(0, 8)}</p>
  <div class="row"><span>Station</span><span>${data.stationName}</span></div>
  <div class="row"><span>Provider</span><span>${data.providerName}</span></div>
  <div class="row"><span>Connector</span><span>${data.connectorType}</span></div>
  <div class="row"><span>Date</span><span>${data.date}</span></div>
  <div class="row"><span>Energy</span><span>${data.kwhDelivered.toFixed(2)} kWh</span></div>
  <div class="row"><span>Provider Rate</span><span>${formatEGP(data.providerCost)}</span></div>
  <div class="row"><span>Service Fee</span><span>${formatEGP(data.serviceFee)}</span></div>
  <div class="row total"><span>Total Paid</span><span>${formatEGP(data.total)}</span></div>
  <p style="color: #6B7280; font-size: 0.85em;">Payment: ${data.paymentMethod}</p>
</body>
</html>`;
  },

  async generateAndShare(data: ReceiptData): Promise<void> {
    const html = this.generateHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
};
