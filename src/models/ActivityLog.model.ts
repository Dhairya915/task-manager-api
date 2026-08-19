import mongoose, { Schema } from 'mongoose';

const activityLogSchema = new Schema(
  {
    userId: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
