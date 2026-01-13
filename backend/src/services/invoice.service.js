import PDFDocument from 'pdfkit';
import db from '../lib/db.js';
import nodemailer from 'nodemailer';

// Helper function to safely get environment variable
function getEnvVar(key, fallback = '') {
  const value = process.env[key];
  return value !== undefined && value !== null ? String(value) : fallback;
}

// Get email transporter
function getEmailTransporter() {
  const smtpHost = getEnvVar('SMTP_HOST', '');
  const smtpPort = Number(getEnvVar('SMTP_PORT', '587'));
  const smtpUser = getEnvVar('SMTP_USER', '');
  const smtpPass = getEnvVar('SMTP_PASS', '');

  return nodemailer.createTransport({
    host: smtpHost || 'localhost',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

class InvoiceService {
  /**
   * Generate PDF invoice for a payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateInvoicePDF(paymentId) {
    // Fetch payment with related data
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Fetch course info from slotIds if available
    let courseInfo = null;
    if (payment.slotIds && payment.slotIds.length > 0) {
      try {
        const slot = await db.timeSlot.findFirst({
          where: { id: payment.slotIds[0] },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                instrument: true,
                pricePerSlot: true,
              },
            },
          },
        });
        if (slot?.course) {
          courseInfo = slot.course;
        }
      } catch (e) {
        console.log('[InvoiceService] Could not fetch course info:', e.message);
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate invoice content
        this._generateInvoiceContent(doc, payment, courseInfo);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate invoice content
   * @private
   */
  _generateInvoiceContent(doc, payment, courseInfo) {
    const user = payment.student;
    const invoiceNumber = `INV-${payment.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Colors
    const primaryColor = '#7c3aed';
    const textColor = '#1f2937';
    const mutedColor = '#6b7280';

    // Header - Company Info
    doc.fillColor(primaryColor)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('GRETEX MUSIC ROOM', 50, 50);

    doc.fillColor(mutedColor)
       .fontSize(10)
       .font('Helvetica')
       .text('Music Education & Training', 50, 78)
       .text('info@gretexindustries.com', 50, 92)
       .text('www.gretexmusicroom.com', 50, 106);

    // Invoice Title
    doc.fillColor(textColor)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('INVOICE', 400, 50, { align: 'right' });

    // Invoice Details Box
    doc.fillColor(mutedColor)
       .fontSize(10)
       .font('Helvetica')
       .text(`Invoice No: ${invoiceNumber}`, 400, 85, { align: 'right' })
       .text(`Date: ${invoiceDate}`, 400, 100, { align: 'right' })
       .text(`Status: ${payment.status}`, 400, 115, { align: 'right' });

    // Divider
    doc.moveTo(50, 140)
       .lineTo(545, 140)
       .strokeColor('#e5e7eb')
       .stroke();

    // Bill To Section
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('BILL TO', 50, 160);

    doc.fillColor(textColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(user?.name || 'Customer', 50, 180);

    doc.fillColor(mutedColor)
       .fontSize(10)
       .font('Helvetica')
       .text(user?.email || '', 50, 196);

    if (user?.phone) {
      doc.text(user.phone, 50, 210);
    }

    // Payment Details
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('PAYMENT DETAILS', 350, 160);

    doc.fillColor(mutedColor)
       .fontSize(10)
       .font('Helvetica')
       .text(`Payment ID: ${payment.gatewayPaymentId || payment.id.slice(0, 12)}`, 350, 180)
       .text(`Order ID: ${payment.gatewayOrderId || 'N/A'}`, 350, 196)
       .text(`Gateway: Razorpay`, 350, 210);

    // Items Table Header
    const tableTop = 280;
    
    doc.fillColor('#f3f4f6')
       .rect(50, tableTop, 495, 25)
       .fill();

    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('DESCRIPTION', 60, tableTop + 8)
       .text('QTY', 350, tableTop + 8, { width: 50, align: 'center' })
       .text('RATE', 400, tableTop + 8, { width: 70, align: 'right' })
       .text('AMOUNT', 470, tableTop + 8, { width: 70, align: 'right' });

    // Items
    let yPosition = tableTop + 35;
    const slotCount = payment.slotIds?.length || 1;
    const itemName = courseInfo?.name || 'Course Purchase';
    const itemInstrument = courseInfo?.instrument || '';
    const pricePerItem = courseInfo?.pricePerSlot || (payment.amount / slotCount);

    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text(itemName, 60, yPosition, { width: 280 });
    
    if (itemInstrument) {
      doc.text(itemInstrument, 60, yPosition + 12, { width: 280 });
    }

    doc.fillColor(textColor)
       .fontSize(10)
       .text(slotCount.toString(), 350, yPosition, { width: 50, align: 'center' })
       .text(`₹${pricePerItem.toLocaleString('en-IN')}`, 400, yPosition, { width: 70, align: 'right' })
       .text(`₹${payment.amount.toLocaleString('en-IN')}`, 470, yPosition, { width: 70, align: 'right' });

    // Row divider
    doc.moveTo(50, yPosition + 40)
       .lineTo(545, yPosition + 40)
       .strokeColor('#e5e7eb')
       .stroke();

    yPosition += 50;

    // Totals Section
    const totalsY = Math.max(yPosition + 20, 400);

    // Subtotal
    doc.fillColor(mutedColor)
       .fontSize(10)
       .font('Helvetica')
       .text('Subtotal:', 380, totalsY, { width: 90, align: 'right' });
    doc.fillColor(textColor)
       .text(`₹${payment.amount.toLocaleString('en-IN')}`, 470, totalsY, { width: 70, align: 'right' });

    // Total
    doc.fillColor(primaryColor)
       .rect(370, totalsY + 25, 175, 30)
       .fill();

    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', 380, totalsY + 33, { width: 90, align: 'right' })
       .text(`₹${payment.amount.toLocaleString('en-IN')}`, 470, totalsY + 33, { width: 70, align: 'right' });

    // Footer
    const footerY = 720;

    doc.moveTo(50, footerY)
       .lineTo(545, footerY)
       .strokeColor('#e5e7eb')
       .stroke();

    doc.fillColor(mutedColor)
       .fontSize(9)
       .font('Helvetica')
       .text('Thank you for choosing Gretex Music Room!', 50, footerY + 15, { align: 'center', width: 495 })
       .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 30, { align: 'center', width: 495 });

    // Terms
    doc.fillColor(mutedColor)
       .fontSize(8)
       .text('For any queries, please contact: info@gretexindustries.com', 50, footerY + 50, { align: 'center', width: 495 });
  }

  /**
   * Generate and return invoice URL (simplified - no Supabase storage)
   * @param {string} paymentId - Payment ID
   * @param {boolean} sendEmail - Whether to send invoice via email
   * @returns {Promise<{url: string, sent: boolean}>}
   */
  async generateAndSaveInvoice(paymentId, sendEmail = false) {
    try {
      console.log('[InvoiceService] Generating invoice for payment:', paymentId);
      console.log('[InvoiceService] sendEmail:', sendEmail);

      // Generate PDF to verify it works
      const pdfBuffer = await this.generateInvoicePDF(paymentId);
      console.log('[InvoiceService] PDF generated, size:', pdfBuffer.length);

      // Return a download URL (the GET endpoint will generate the PDF on-demand)
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const invoiceUrl = `${backendUrl}/api/invoices/${paymentId}`;

      // Send email if requested
      let emailSent = false;
      if (sendEmail) {
        try {
          console.log('[InvoiceService] Attempting to send invoice email...');
          
          // Get payment with user info
          const payment = await db.payment.findUnique({
            where: { id: paymentId },
            include: {
              student: {
                select: { name: true, email: true },
              },
            },
          });

          if (!payment?.student?.email) {
            console.error('[InvoiceService] No user email found');
          } else {
            const userEmail = payment.student.email;
            const userName = payment.student.name || 'Customer';
            const invoiceNumber = `INV-${paymentId.slice(0, 8).toUpperCase()}`;
            const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-IN');
            const amount = `₹${payment.amount.toLocaleString('en-IN')}`;

            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #7c3aed;">🎵 Gretex Music Room - Invoice</h2>
                <p>Hi ${userName},</p>
                <p>Thank you for your payment! Your invoice is attached.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Invoice:</strong> ${invoiceNumber}</p>
                  <p><strong>Date:</strong> ${invoiceDate}</p>
                  <p><strong>Amount:</strong> ${amount}</p>
                  <p><strong>Status:</strong> ✓ ${payment.status}</p>
                </div>
                <p style="color: #6b7280; font-size: 12px;">For queries, contact info@gretexindustries.com</p>
              </div>
            `;

            const transporter = getEmailTransporter();
            const fromAddress = getEnvVar('EMAIL_FROM', '') || getEnvVar('SMTP_USER', '');

            const mailOptions = {
              from: fromAddress,
              to: userEmail,
              subject: `Your Invoice ${invoiceNumber} - Gretex Music Room`,
              html,
              attachments: [{
                filename: `invoice-${invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              }],
            };

            console.log('[InvoiceService] Sending email to:', userEmail);
            const info = await transporter.sendMail(mailOptions);
            console.log('[InvoiceService] ✅ Email sent:', info.messageId);
            emailSent = true;
          }
        } catch (emailError) {
          console.error('[InvoiceService] Failed to send invoice email:', emailError.message);
        }
      } else {
        console.log('[InvoiceService] Email not requested (sendEmail=false)');
      }

      return { url: invoiceUrl, sent: emailSent };
    } catch (error) {
      console.error('[InvoiceService] Error generating invoice:', error);
      throw error;
    }
  }
}

export default new InvoiceService();
