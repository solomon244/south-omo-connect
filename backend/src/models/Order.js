import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  buyerName: { type: String, required: true, trim: true },
  buyerContact: { type: String, default: '' },
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['requested', 'accepted', 'fulfilled', 'cancelled'], default: 'requested' },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
