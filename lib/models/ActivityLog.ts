import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);