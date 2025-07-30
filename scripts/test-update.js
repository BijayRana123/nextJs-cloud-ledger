import mongoose from 'mongoose';
import { SalesVoucher2 } from '../lib/models.js';

await mongoose.connect('mongodb+srv://janejack717:iFrQrYuHmIDRz7IE@cluster0.g3hztur.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
const id = '6863e4c0ec72e92520d790b1';
const result = await SalesVoucher2.updateOne(
  { _id: id },
  { salesVoucherNumber: 'SV-TEST-FINAL' }
);

const doc = await SalesVoucher2.findById(id);

await mongoose.disconnect();
