import { Router } from 'express';
import Product from '../models/Product.js';

const router = Router();
const demoProducts = [
  { _id: 'demo-honey', title: 'Locally Harvested Honey', description: 'Raw honey offered by a local producer group. Ask the producer about harvest details and available quantities.', category: 'Honey & food', producerName: 'Omo Valley Producers Group', location: 'South Omo', price: 450, unit: 'jar', quantity: 60, verified: true, groupName: 'Omo Valley Producers Group', kind: 'product' },
  { _id: 'demo-basket', title: 'Handwoven Storage Basket', description: 'Handmade woven basket. Dimensions and custom orders can be confirmed directly with the artisan.', category: 'Handicrafts', producerName: 'Ari Artisan Collective', location: 'South Omo', price: 650, unit: 'basket', quantity: 24, verified: true, groupName: 'Ari Artisan Collective', kind: 'product' },
  { _id: 'demo-textile', title: 'Traditional Textile', description: 'Locally made textile. Color, size and availability should be confirmed before purchase.', category: 'Textiles', producerName: 'Community Textile Makers', location: 'South Omo', price: 900, unit: 'piece', quantity: 15, verified: false, groupName: 'Community Textile Makers', kind: 'product' },
  { _id: 'demo-tour', title: 'Community-led Cultural Visit', description: 'A community-led visit arranged with local hosts. Activities, cultural permissions, duration and inclusions must be agreed before booking.', category: 'Tourism experience', producerName: 'South Omo Local Hosts', location: 'South Omo', price: 1200, unit: 'person', quantity: 10, verified: true, groupName: 'South Omo Local Hosts', kind: 'experience' },
  { _id: 'demo-food', title: 'Traditional Food Order', description: 'Traditional food prepared by local cooks for pre-arranged orders. Ingredients, timing and dietary needs should be confirmed.', category: 'Traditional food', producerName: 'Local Food Makers', location: 'South Omo', price: 300, unit: 'serving', quantity: 40, verified: false, groupName: '', kind: 'product' }
];

router.get('/', async (req, res, next) => {
  try {
    if (req.app.locals.dbConnected) {
      const filter = {};
      if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
      if (req.query.search) filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { producerName: { $regex: req.query.search, $options: 'i' } }
      ];
      return res.json(await Product.find(filter).sort({ createdAt: -1 }).lean());
    }
    let products = [...demoProducts, ...(req.app.locals.memoryProducts || [])];
    if (req.query.category && req.query.category !== 'All') products = products.filter(p => p.category === req.query.category);
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      products = products.filter(p => `${p.title} ${p.description} ${p.producerName}`.toLowerCase().includes(q));
    }
    res.json(products);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, producerName, price, quantity } = req.body;
    if (!title?.trim() || !producerName?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Title, producer name and a valid non-negative price are required.' });
    }
    const data = {
      title: String(title).trim(), description: String(req.body.description || '').trim(),
      category: req.body.category || 'Other', producerName: String(producerName).trim(),
      location: String(req.body.location || 'South Omo').trim(), price: Number(price),
      unit: String(req.body.unit || 'item'), quantity: Math.max(0, Number(quantity ?? 1)),
      imageUrl: String(req.body.imageUrl || ''), verified: false,
      groupName: String(req.body.groupName || ''), kind: req.body.kind === 'experience' ? 'experience' : 'product'
    };
    let saved;
    if (req.app.locals.dbConnected) saved = await Product.create(data);
    else {
      saved = { ...data, _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
      req.app.locals.memoryProducts.push(saved);
    }
    res.status(201).json(saved);
  } catch (error) { next(error); }
});

router.patch('/:id/verify', async (req, res, next) => {
  try {
    let updated;
    if (req.app.locals.dbConnected) updated = await Product.findByIdAndUpdate(req.params.id, { verified: Boolean(req.body.verified) }, { new: true });
    else {
      const item = (req.app.locals.memoryProducts || []).find(p => p._id === req.params.id) || demoProducts.find(p => p._id === req.params.id);
      if (item) { item.verified = Boolean(req.body.verified); updated = item; }
    }
    if (!updated) return res.status(404).json({ message: 'Product not found. Demo seed listings are read-only.' });
    res.json(updated);
  } catch (error) { next(error); }
});

export default router;
