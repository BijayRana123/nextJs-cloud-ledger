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

  } catch (error) {
    console.error('Error updating purchase return vouchers:', error);
  } finally {
    await mongoose.connection.close();

  }
}); 
