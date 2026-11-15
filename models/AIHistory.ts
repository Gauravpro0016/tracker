import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIHistory extends Document {
  userId: mongoose.Types.ObjectId;
  type: "chat" | "planner" | "quiz" | "analytics";
  title: string;
  summary?: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const AIHistorySchema = new Schema<IAIHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["chat", "planner", "quiz", "analytics"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "" },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

AIHistorySchema.index({ userId: 1, type: 1, updatedAt: -1 });

export const AIHistory: Model<IAIHistory> =
  mongoose.models.AIHistory || mongoose.model<IAIHistory>("AIHistory", AIHistorySchema);

export default AIHistory;
