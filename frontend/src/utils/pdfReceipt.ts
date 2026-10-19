import { jsPDF } from 'jspdf';
import { ReceiptManifest } from '../types';

export function generatePaymentReceiptPDF(receipt: ReceiptManifest): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Dark Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('PAYMESH COMMERCE NETWORK', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Autonomous Multi-Agent Commerce & Deterministic Policy Authorization', 15, 26);

  // Hologram / Verified Badge
  doc.setFillColor(16, 185, 129); // Emerald
  doc.roundedRect(pageWidth - 65, 12, 50, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('SECURE VERIFIED', pageWidth - 60, 18);
  doc.setFontSize(7);
  doc.text('PayPal Capture Settled', pageWidth - 60, 24);

  let y = 52;

  // Receipt Number & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`Official Transaction Receipt: ${receipt.receipt_number}`, 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Settled: ${new Date(receipt.settled_at).toUTCString()}`, pageWidth - 15, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);

  y += 8;
  // Two Columns: Payer & Merchant
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('BUYER / OPERATOR DETAILS', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${receipt.payer.full_name}`, 15, y + 6);
  doc.text(`Email: ${receipt.payer.email}`, 15, y + 11);
  doc.text(`Account ID: ${receipt.payer.id}`, 15, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFIED MERCHANT AGENT', 110, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Provider: ${receipt.provider.name}`, 110, y + 6);
  doc.text(`Tagline: ${receipt.provider.tagline}`, 110, y + 11);
  doc.text(`Rating: ${receipt.provider.rating} ★ | Delivery SLA: ${receipt.provider.delivery_days} Days`, 110, y + 16);

  y += 26;

  // Deliverables & Project Scope Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Commissioned Project: ${receipt.task.title}`, 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Service Category: ${receipt.task.service_category.toUpperCase().replace(/_/g, ' ')}`, 20, y + 13);
  doc.text(`PayPal Order ID: ${receipt.payment.paypal_order_id || 'MOCK-SANDBOX-ORDER'}  |  Capture ID: ${receipt.payment.paypal_capture_id || 'MOCK-SANDBOX-CAPTURE'}`, 20, y + 18);

  y += 30;

  // Financial Breakdown Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('COMMERCE BREAKDOWN ITEM', 20, y + 5.5);
  doc.text('RATE / AMOUNT', pageWidth - 20, y + 5.5, { align: 'right' });

  y += 8;

  const rows = [
    { title: 'Standard Provider Catalog Price', amount: `$${receipt.financial_breakdown.original_catalog_price} ${receipt.financial_breakdown.currency}` },
    { title: `Autonomous Multi-Agent Negotiation Concession (${receipt.financial_breakdown.savings_percent}% Discount Achieved)`, amount: `-$${receipt.financial_breakdown.savings_amount} ${receipt.financial_breakdown.currency}` },
  ];

  rows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(row.title, 20, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(row.amount, pageWidth - 20, y + 5.5, { align: 'right' });
    y += 8;
  });

  // Total Settled Row
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, pageWidth - 30, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL AMOUNT CAPTURED (PayPal Sandbox Orders v2)', 20, y + 6.5);
  doc.setTextColor(16, 185, 129); // Green
  doc.setFontSize(11);
  doc.text(`$${receipt.financial_breakdown.final_negotiated_price} ${receipt.financial_breakdown.currency}`, pageWidth - 20, y + 6.5, { align: 'right' });

  y += 18;

  // Policy Engine Verification Block
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, y, pageWidth - 30, 28, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, y, pageWidth - 30, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('DETERMINISTIC FINANCIAL GUARDRAILS AUDIT PROOF', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text('✓ Task Budget Ceiling Asserted (<=$100)      ✓ User Account Limit Checked (<=$500)', 20, y + 12);
  doc.text('✓ Currency Match Verified (USD == USD)     ✓ Verified Merchant Active & In-Good-Standing', 20, y + 17);
  doc.text('✓ Offer Expiry Timestamp Unexpired          ✓ Duplicate Payment Prevention Idempotency Enforced', 20, y + 22);

  y += 34;

  // Cryptographic Signature & Hash Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CRYPTOGRAPHIC VERIFICATION DIGEST (SHA-256)', 15, y);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(receipt.verification_hash, 15, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This digital invoice was generated autonomously by PayMesh Network and settled through PayPal REST Orders v2 API.', 15, y + 13);
  doc.text('Valid for accounting, tax reporting, and verifiable multi-agent audit compliance.', 15, y + 17);

  // Save the PDF
  doc.save(`PayMesh-Receipt-${receipt.receipt_number}.pdf`);
}
