import dbConnect from '../lib/dbConnect.js';
import PaymentVoucher from '../lib/models/PaymentVoucher.js';

async function checkPaymentVoucherNumbers() {
  await dbConnect();
  console.log('Checking payment voucher numbers...\n');

  try {
    // Get all payment vouchers grouped by paymentVoucherNumber
    const duplicates = await PaymentVoucher.aggregate([
      {
        $group: {
          _id: '$paymentVoucherNumber',
          count: { $sum: 1 },
          docs: { $push: { id: '$_id', organization: '$organization', date: '$date' } }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicates.length > 0) {
      console.log('🚨 Found duplicate payment voucher numbers:');
      duplicates.forEach(dup => {
        console.log(`\nVoucher Number: ${dup._id} (${dup.count} duplicates)`);
        dup.docs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ID: ${doc.id}, Org: ${doc.organization}, Date: ${doc.date}`);
        });
      });
    } else {
      console.log('✅ No duplicate payment voucher numbers found');
    }

    // Check total count and number patterns
    const totalVouchers = await PaymentVoucher.countDocuments();
    console.log(`\n📊 Total Payment Vouchers: ${totalVouchers}`);

    // Check different number formats
    const formats = await PaymentVoucher.aggregate([
      {
        $project: {
          numberLength: { $strLenCP: '$paymentVoucherNumber' },
          numberFormat: '$paymentVoucherNumber'
        }
      },
      {
        $group: {
          _id: '$numberLength',
          count: { $sum: 1 },
          examples: { $push: '$numberFormat' }
        }
      }
    ]);

    console.log('\n📋 Number format analysis:');
    formats.forEach(format => {
      console.log(`  Length ${format._id}: ${format.count} vouchers`);
      console.log(`    Examples: ${format.examples.slice(0, 3).join(', ')}`);
    });

  } catch (error) {
    console.error('Error checking payment voucher numbers:', error);
  }

  process.exit(0);
}

checkPaymentVoucherNumbers();