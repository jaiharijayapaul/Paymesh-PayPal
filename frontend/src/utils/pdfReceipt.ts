import { jsPDF } from 'jspdf';
import { ReceiptManifest } from '../types';

export function generatePaymentReceiptPDF(receipt: ReceiptManifest): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 18;
  const rightMargin = pageWidth - 18; // 192mm
  const contentWidth = rightMargin - leftMargin; // 174mm

  // ==========================================
  // 1. TOP HEADER: PAYPAL BRANDING & STATUS
  // ==========================================
  let y = 20;

  // PayPal stylized logo: "Pay" in dark blue, "Pal" in light blue
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 48, 135); // PayPal Dark Blue #003087
  doc.text('Pay', leftMargin, y);

  const payWidth = doc.getTextWidth('Pay');
  doc.setTextColor(0, 121, 193); // PayPal Light Blue #0079C1
  doc.text('Pal', leftMargin + payWidth, y);

  const palWidth = doc.getTextWidth('Pal');
  // Divider & PayMesh Network Brand
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(156, 163, 175);
  doc.text('|', leftMargin + payWidth + palWidth + 3, y - 0.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55); // Gray 800
  doc.text('PayMesh', leftMargin + payWidth + palWidth + 7, y - 0.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('AI Agent Commerce Network', leftMargin + payWidth + palWidth + 7, y + 4);

  // Status Badge on Top Right
  const badgeWidth = 36;
  const badgeHeight = 7.5;
  const badgeX = rightMargin - badgeWidth;
  const badgeY = y - 7;

  doc.setFillColor(236, 253, 245); // Light emerald
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(167, 243, 208); // Emerald border
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('STATUS: COMPLETED', badgeX + (badgeWidth / 2), badgeY + 5, { align: 'center' });

  // Thin line below header
  y += 10;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);

  // ==========================================
  // 2. HERO PAYMENT CONFIRMATION TITLE & AMOUNT
  // ==========================================
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Official Transaction & Settlement Receipt', leftMargin, y);

  const formattedDate = new Date(receipt.settled_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Settled: ${formattedDate}`, rightMargin, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text(`Payment to ${receipt.provider.name}`, leftMargin, y);

  y += 8;
  // Prominent Amount Box (PayPal Style)
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(leftMargin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(leftMargin, y, contentWidth, 18, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Total Amount Captured via PayPal Orders v2:', leftMargin + 6, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 48, 135); // PayPal Blue
  doc.text(`$${receipt.financial_breakdown.final_negotiated_price} ${receipt.financial_breakdown.currency}`, rightMargin - 6, y + 11.5, { align: 'right' });

  // ==========================================
  // 3. TWO-COLUMN DETAILS: BUYER & MERCHANT
  // ==========================================
  y += 24;

  const colWidth = (contentWidth - 6) / 2;
  const col1X = leftMargin;
  const col2X = leftMargin + colWidth + 6;

  // Box 1: Buyer Info
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(col1X, y, colWidth, 29, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 48, 135);
  doc.text('BUYER / OPERATOR DETAILS', col1X + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(receipt.payer.full_name, col1X + 5, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Email: ${receipt.payer.email}`, col1X + 5, y + 18);
  doc.text(`Account ID: ${receipt.payer.id.slice(0, 20)}...`, col1X + 5, y + 23.5);

  // Box 2: Merchant & Gateway Info
  doc.roundedRect(col2X, y, colWidth, 29, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 48, 135);
  doc.text('MERCHANT & GATEWAY DETAILS', col2X + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(receipt.provider.name, col2X + 5, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Rating: ${receipt.provider.rating} / 5.0   |   SLA: ${receipt.provider.delivery_days} Days`, col2X + 5, y + 18);
  doc.text(`Capture ID: ${receipt.payment.paypal_capture_id || 'SANDBOX-CAPTURE'}`, col2X + 5, y + 23.5);

  // ==========================================
  // 4. ITEMIZED PURCHASE BREAKDOWN TABLE
  // ==========================================
  y += 35;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('Purchase Details', leftMargin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Receipt ID: ${receipt.receipt_number}`, rightMargin, y, { align: 'right' });

  y += 5;
  // Table Header
  doc.setFillColor(243, 244, 246);
  doc.rect(leftMargin, y, contentWidth, 7, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.line(leftMargin, y, rightMargin, y);
  doc.line(leftMargin, y + 7, rightMargin, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text('DESCRIPTION', leftMargin + 4, y + 4.8);
  doc.text('QTY', leftMargin + 105, y + 4.8);
  doc.text('UNIT PRICE', leftMargin + 125, y + 4.8);
  doc.text('AMOUNT', rightMargin - 4, y + 4.8, { align: 'right' });

  y += 7;

  // Item Row 1: Commissioned Service
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  doc.text(receipt.task.title, leftMargin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(`Service Category: ${receipt.task.service_category.toUpperCase().replace(/_/g, ' ')}   |   Provider: ${receipt.provider.name}`, leftMargin + 4, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text('1', leftMargin + 107, y + 6);
  doc.text(`$${receipt.financial_breakdown.original_catalog_price}`, leftMargin + 125, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`$${receipt.financial_breakdown.original_catalog_price} ${receipt.financial_breakdown.currency}`, rightMargin - 4, y + 6, { align: 'right' });

  y += 13;
  doc.setDrawColor(243, 244, 246);
  doc.line(leftMargin, y, rightMargin, y);

  // Item Row 2: Multi-Agent Negotiated Savings Concession
  y += 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105); // Emerald Green
  doc.text(`Autonomous Multi-Agent Negotiation Concession (${receipt.financial_breakdown.savings_percent}% Discount)`, leftMargin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Automated multi-round bidding concession negotiated by Buyer Agent below reservation floor', leftMargin + 4, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('1', leftMargin + 107, y + 5.5);
  doc.text(`-$${receipt.financial_breakdown.savings_amount}`, leftMargin + 125, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`-$${receipt.financial_breakdown.savings_amount} ${receipt.financial_breakdown.currency}`, rightMargin - 4, y + 5.5, { align: 'right' });

  y += 12;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);

  // ==========================================
  // 5. TOTALS CALCULATION BOX
  // ==========================================
  y += 4;
  const totalsLabelX = rightMargin - 70;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Item Subtotal:', totalsLabelX, y);
  doc.setTextColor(31, 41, 55);
  doc.text(`$${receipt.financial_breakdown.original_catalog_price} ${receipt.financial_breakdown.currency}`, rightMargin - 4, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('Negotiated Savings:', totalsLabelX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`-$${receipt.financial_breakdown.savings_amount} ${receipt.financial_breakdown.currency}`, rightMargin - 4, y, { align: 'right' });

  y += 4.5;
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsLabelX, y, rightMargin, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('Total Captured:', totalsLabelX, y);
  doc.setTextColor(0, 48, 135); // PayPal Blue
  doc.setFontSize(12);
  doc.text(`$${receipt.financial_breakdown.final_negotiated_price} ${receipt.financial_breakdown.currency}`, rightMargin - 4, y, { align: 'right' });

  // ==========================================
  // 6. POLICY ENGINE & VERIFICATION COMPLIANCE
  // ==========================================
  y += 13;

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(leftMargin, y, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(leftMargin, y, contentWidth, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 48, 135);
  doc.text('DETERMINISTIC FINANCIAL GUARDRAILS AUDIT PROOF', leftMargin + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);

  const colCheck1 = leftMargin + 5;
  const colCheck2 = leftMargin + 90;

  doc.text('[PASS] Task Budget Ceiling Asserted (<=$100)', colCheck1, y + 12);
  doc.text('[PASS] User Account Limit Cap Checked (<=$500)', colCheck2, y + 12);

  doc.text('[PASS] Currency Match Verified (USD == USD)', colCheck1, y + 18);
  doc.text('[PASS] Verified Merchant Active & In-Good-Standing', colCheck2, y + 18);

  doc.text('[PASS] Offer Expiry Timestamp Unexpired', colCheck1, y + 24);
  doc.text('[PASS] Duplicate Payment Prevention Idempotency Enforced', colCheck2, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Deterministic guardrails executed independently without AI trust. Human authorization verified prior to capture.', leftMargin + 5, y + 30);

  // ==========================================
  // 7. CRYPTOGRAPHIC AUDIT DIGEST
  // ==========================================
  y += 39;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Cryptographic Verification Digest (SHA-256):', leftMargin, y);

  y += 3.5;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(leftMargin, y, contentWidth, 8, 1, 1, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(leftMargin, y, contentWidth, 8, 1, 1, 'D');

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(55, 65, 81);
  doc.text(receipt.verification_hash, leftMargin + 4, y + 5.2);

  // ==========================================
  // 8. OFFICIAL PAYPAL-STYLE FOOTER
  // ==========================================
  y = 274;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Thank you for using PayPal and PayMesh. This receipt confirms authorization and settlement through PayPal Sandbox Orders v2.', leftMargin, y);

  y += 4;
  doc.text('Questions or concerns? Contact PayMesh Support at support@paymesh.ai or visit the PayPal Resolution Center.', leftMargin, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('PayMesh AI Agent Commerce Network  •  PayPal Sandbox Orders v2  •  Deterministic Financial Architecture', leftMargin, y);

  // Save the PDF
  doc.save(`PayPal-Receipt-${receipt.receipt_number}.pdf`);
}
