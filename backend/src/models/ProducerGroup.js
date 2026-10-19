import mongoose from 'mongoose';

const ProducerGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, default: 'South Omo' },
  members: { type: [String], default: [] },
  description: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.ProducerGroup || mongoose.model('ProducerGroup', ProducerGroupSchema);
