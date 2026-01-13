import express from 'express';
import { authenticate } from '../middleware/auth.js';
import invoiceService from '../services/invoice.service.js';
import db from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * GET /api/invoices/:paymentId
 * Get invoice PDF for a payment (download/view)
 * Supports both header auth and query param token
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { token } = req.query;
    
    // Get user from token (query param or header)
    let userId;
    const authToken = token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      userId = decoded.userId || decoded.id;
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Verify user owns this payment (studentId is the user)
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        studentId: userId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or access denied',
      });
    }

    // Generate PDF
    const pdfBuffer = await invoiceService.generateInvoicePDF(paymentId);

    // Set headers for PDF view/download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${paymentId.slice(0, 8)}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Invoice Routes] Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice',
    });
  }
});

/**
 * POST /api/invoices/:paymentId/generate
 * Generate and save invoice to storage
 */
router.post('/:paymentId/generate', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;
    const { sendEmail = false } = req.body;

    // Verify user owns this payment (studentId is the user)
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        studentId: userId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or access denied',
      });
    }

    const result = await invoiceService.generateAndSaveInvoice(paymentId, sendEmail);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Invoice Routes] Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice',
    });
  }
});

export default router;
