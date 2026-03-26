import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: Arial; padding: 40px; max-width: 400px; margin: auto; }
        h1 { color: #10B981; font-size: 20px; text-align: center; }
        .logo { text-align: center; font-size: 24px; margin-bottom: 20px; }
        .divider { border-top: 1px solid #E5E7EB; margin: 16px 0; }
        .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
        .total { font-weight: bold; font-size: 18px; color: #064E3B; }
        .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 24px; }
      </style></head><body>
        <div class="logo">&#9889;</div>
        <h1>EV Charge Egypt</h1>
        <p style="text-align:center;color:#6B7280;">Charging Receipt</p>
        <div class="divider"></div>
        <div class="row"><span>Station</span><span>${data.stationName}</span></div>
        <div class="row"><span>Provider</span><span>${data.providerName}</span></div>
        <div class="row"><span>Connector</span><span>${data.connectorType}</span></div>
        <div class="row"><span>Date</span><span>${data.date}</span></div>
        <div class="row"><span>Energy</span><span>${data.kwhDelivered.toFixed(1)} kWh</span></div>
        <div class="divider"></div>
        <div class="row"><span>Charging Cost</span><span>${formatEGP(data.providerCost)}</span></div>
        <div class="row"><span>Service Fee</span><span>${formatEGP(data.serviceFee)}</span></div>
        <div class="divider"></div>
        <div class="row total"><span>Total</span><span>${formatEGP(data.total)}</span></div>
        <div class="row"><span>Payment</span><span>${data.paymentMethod}</span></div>
        <div class="footer">Ref: ${data.bookingId}<br/>Thank you for charging with us!</div>
      </body></html>
    `;
  },

  async generateAndShare(data: ReceiptData): Promise<void> {
    const html = this.generateHTML(data);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Receipt',
    });
  },
};
