import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import groupRoutes from './routes/groups.js';
import aiRoutes from './routes/ai.js';
import Product from './models/Product.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim()) : true }));
app.use(express.json({ limit: '1mb' }));
app.locals.dbConnected = false;
app.locals.memoryProducts = [];
app.locals.memoryOrders = [];
app.locals.memoryGroups = [];

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: app.locals.dbConnected ? 'connected' : 'demo-memory-mode', app: 'South Omo Connect API' }));
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai', aiRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Unexpected server error.' });
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      app.locals.dbConnected = true;
      const count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany([
          { title: 'Locally Harvested Honey', description: 'Raw honey offered by a local producer group. Ask the producer about harvest details and available quantities.', category: 'Honey & food', producerName: 'Omo Valley Producers Group', location: 'South Omo', price: 450, unit: 'jar', quantity: 60, verified: true, groupName: 'Omo Valley Producers Group', kind: 'product' },
          { title: 'Handwoven Storage Basket', description: 'Handmade woven basket. Dimensions and custom orders can be confirmed directly with the artisan.', category: 'Handicrafts', producerName: 'Ari Artisan Collective', location: 'South Omo', price: 650, unit: 'basket', quantity: 24, verified: true, groupName: 'Ari Artisan Collective', kind: 'product' },
          { title: 'Traditional Textile', description: 'Locally made textile. Color, size and availability should be confirmed before purchase.', category: 'Textiles', producerName: 'Community Textile Makers', location: 'South Omo', price: 900, unit: 'piece', quantity: 15, verified: false, groupName: 'Community Textile Makers', kind: 'product' },
          { title: 'Community-led Cultural Visit', description: 'A community-led visit arranged with local hosts. Activities, cultural permissions, duration and inclusions must be agreed before booking.', category: 'Tourism experience', producerName: 'South Omo Local Hosts', location: 'South Omo', price: 1200, unit: 'person', quantity: 10, verified: true, groupName: 'South Omo Local Hosts', kind: 'experience' },
          { title: 'Traditional Food Order', description: 'Traditional food prepared by local cooks for pre-arranged orders. Ingredients, timing and dietary needs should be confirmed.', category: 'Traditional food', producerName: 'Local Food Makers', location: 'South Omo', price: 300, unit: 'serving', quantity: 40, verified: false, groupName: '', kind: 'product' }
        ]);
        console.log('Inserted illustrative demo listings into empty database.');
      }
      console.log('MongoDB connected.');
    } catch (error) {
      console.warn(`MongoDB unavailable (${error.message}). Starting in demo-memory mode; data will not persist after restart.`);
    }
  } else console.warn('MONGODB_URI is not set. Starting in demo-memory mode; data will not persist after restart.');
  app.listen(PORT, () => console.log(`South Omo Connect API listening at http://localhost:${PORT}`));
}
start();
