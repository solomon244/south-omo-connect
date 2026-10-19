import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  category: { type: String, enum: ['Handicrafts', 'Honey & food', 'Textiles', 'Produce', 'Tourism experience', 'Traditional food', 'Other'], default: 'Other' },
  producerName: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, default: 'South Omo' },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'item' },
  quantity: { type: Number, default: 1, min: 0 },
  imageUrl: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
  kind: { type: String, enum: ['product', 'experience'], default: 'product' }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
