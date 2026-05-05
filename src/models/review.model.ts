import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: 'Festival' | 'Product';
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Festival', 'Product'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true, // Default to true for now, can be changed to false for moderation
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ targetId: 1, targetType: 1 });
ReviewSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true }); // Prevent multiple reviews from same user on same target

// Handle model compilation error in Next.js hot-reloading
const modelName = 'MarketplaceReview';
if (mongoose.models[modelName]) {
  delete (mongoose.models as any)[modelName];
}

const MarketplaceReview = mongoose.model<IReview>(modelName, ReviewSchema, 'reviews');

// Cleanup legacy indexes that cause duplicate key errors
// We wrap this in a check to ensure it only runs once and doesn't crash the server
if (typeof window === 'undefined' && mongoose.connection.readyState >= 1) {
  const cleanupIndexes = async () => {
    try {
      const indexes = await MarketplaceReview.collection.listIndexes().toArray();
      const legacyIndexes = [
        'tourist_1_targetId_1', 
        'tourist_1_festival_1', 
        'tourist_1_product_1',
        'tourist_1_targetId_1_targetType_1',
        'tourist_1_targetType_1_targetId_1'
      ];
      for (const indexName of legacyIndexes) {
        if (indexes.find(idx => idx.name === indexName)) {
          await MarketplaceReview.collection.dropIndex(indexName);
          console.log(`Successfully dropped legacy index: ${indexName}`);
        }
      }
    } catch (err) {
      // Ignore errors during cleanup to prevent server crash
      console.warn('Review index cleanup skipped:', err.message);
    }
  };
  cleanupIndexes();
} else if (typeof window === 'undefined') {
    // If connection not ready, wait for it
    mongoose.connection.once('open', () => {
        // Run cleanup once connection is open
        const MarketplaceReviewModel = mongoose.model<IReview>(modelName);
        MarketplaceReviewModel.collection.listIndexes().toArray().then(indexes => {
            const legacyIndexes = ['tourist_1_targetId_1', 'tourist_1_festival_1', 'tourist_1_product_1', 'tourist_1_targetId_1_targetType_1', 'tourist_1_targetType_1_targetId_1'];
            legacyIndexes.forEach(name => {
                if (indexes.find(idx => idx.name === name)) {
                    MarketplaceReviewModel.collection.dropIndex(name).catch(() => {});
                }
            });
        }).catch(() => {});
    });
}

export default MarketplaceReview;