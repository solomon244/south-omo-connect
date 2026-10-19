import { Router } from 'express';
import ProducerGroup from '../models/ProducerGroup.js';
const router = Router();
const examples = [
  { _id: 'group-1', name: 'Omo Valley Producers Group', location: 'South Omo', members: ['Honey producers', 'Local food makers'], description: 'Illustrative demo group for pooled products and shared transport.' },
  { _id: 'group-2', name: 'Ari Artisan Collective', location: 'South Omo', members: ['Basket artisans'], description: 'Illustrative demo group for collective craft sales.' }
];
router.get('/', async (req, res, next) => {
  try { res.json(req.app.locals.dbConnected ? await ProducerGroup.find().lean() : [...examples, ...(req.app.locals.memoryGroups || [])]); }
  catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ message: 'Group name is required.' });
    const data = { name: String(req.body.name).trim(), location: String(req.body.location || 'South Omo').trim(), members: Array.isArray(req.body.members) ? req.body.members.map(String) : [], description: String(req.body.description || '').trim() };
    const group = req.app.locals.dbConnected ? await ProducerGroup.create(data) : { ...data, _id: `group-${Date.now()}` };
    if (!req.app.locals.dbConnected) req.app.locals.memoryGroups.push(group);
    res.status(201).json(group);
  } catch (error) { next(error); }
});
export default router;
