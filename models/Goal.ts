import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subjectId?: mongoose.Types.ObjectId | null;
  type: "daily" | "weekly" | "monthly";
  targetHours: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null, index: true },
    type: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
    targetHours: { type: Number, required: true, min: 0.1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, active: 1 });
GoalSchema.index({ userId: 1, subjectId: 1 });

if (mongoose.models.Goal) {
  delete (mongoose.models as any).Goal;
}

export const Goal: Model<IGoal> = mongoose.model<IGoal>("Goal", GoalSchema);
export default Goal;
