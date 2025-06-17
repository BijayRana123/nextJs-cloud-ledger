const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Update all purchase return vouchers with referenceNo starting with 'PR-'
    const result = await db.collection('purchasereturnvouchers').updateMany(
      { referenceNo: { $regex: /^PR-/ } },
      [
        {
          $set: {
            referenceNo: {
              $replaceOne: { input: "$referenceNo", find: "PR-", replacement: "PRV-" }
            }
          }
        }
      ]
    );
    console.log(`Updated ${result.modifiedCount} purchase return vouchers.`);
  } catch (error) {
    console.error('Error updating purchase return vouchers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}); 