import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
} from "../services/razorpay.service.js";

export const createOrder = async (req, res) => {
  try {
    const result = await createRazorpayOrder(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const result = await verifyRazorpayPayment(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    await handleRazorpayWebhook(req);
    res.status(200).send("OK");
  } catch (err) {
    res.status(400).send("Webhook error");
  }
};
