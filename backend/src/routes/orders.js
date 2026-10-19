import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = Router();
const demoProducts = {
  'demo-honey': { title: 'Locally Harvested Honey', price: 450, quantity: 60 },
  'demo-basket': { title: 'Handwoven Storage Basket', price: 650, quantity: 24 },
  'demo-textile': { title: 'Traditional Textile', price: 900, quantity: 15 },
  'demo-tour': { title: 'Community-led Cultural Visit', price: 1200, quantity: 10 },
  'demo-food': { title: 'Traditional Food Order', price: 300, quantity: 40 }
};

router.get('/', async (req, res, next) => {
  try {
    if (req.app.locals.dbConnected) return res.json(await Order.find().sort({ createdAt: -1 }).lean());
    res.json(req.app.locals.memoryOrders || []);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity, buyerName } = req.body;
    const qty = Number(quantity);
    if (!productId || !buyerName?.trim() || !Number.isInteger(qty) || qty < 1) return res.status(400).json({ message: 'Product, buyer name and a whole-number quantity of at least 1 are required.' });
    let product;
    if (req.app.locals.dbConnected) product = await Product.findById(productId).lean();
    else product = [...Object.entries(demoProducts).map(([id, p]) => ({ _id: id, ...p })), ...(req.app.locals.memoryProducts || [])].find(p => p._id === productId);
    if (!product) return res.status(404).json({ message: 'Product not found. Refresh the marketplace and try again.' });
    if (qty > Number(product.quantity ?? 0)) return res.status(400).json({ message: `Only ${product.quantity} units are currently listed.` });
    const orderData = {
      buyerName: String(buyerName).trim(), buyerContact: String(req.body.buyerContact || '').trim(),
      productId: String(productId), productTitle: product.title, quantity: qty,
      unitPrice: Number(product.price), total: qty * Number(product.price),
      notes: String(req.body.notes || '').trim(), status: 'requested'
    };
    let saved;
    if (req.app.locals.dbConnected) saved = await Order.create(orderData);
    else { saved = { ...orderData, _id: `order-${Date.now()}`, createdAt: new Date().toISOString() }; req.app.locals.memoryOrders.push(saved); }
    res.status(201).json(saved);
  } catch (error) { next(error); }
});

export default router;
