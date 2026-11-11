import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlannerItem extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subjectId?: mongoose.Types.ObjectId | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  priority: "low" | "medium" | "high";
  status: "pending" | "done";
  recurring: "none" | "daily" | "weekly";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlannerItemSchema = new Schema<IPlannerItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "done"], default: "pending" },
    recurring: { type: String, enum: ["none", "daily", "weekly"], default: "none" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

PlannerItemSchema.index({ userId: 1, date: 1, startTime: 1 });

export const PlannerItem: Model<IPlannerItem> =
  mongoose.models.PlannerItem ||
  mongoose.model<IPlannerItem>("PlannerItem", PlannerItemSchema);
export default PlannerItem;

