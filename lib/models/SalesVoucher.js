import mongoose from 'mongoose';

const SalesVoucherSchema = new mongoose.Schema({
  salesVoucherNumber: { type: String, required: true, unique: true },
  // Add other fields as needed for your app
}, { timestamps: true });

export default mongoose.models.SalesVoucher || mongoose.model('SalesVoucher', SalesVoucherSchema); 