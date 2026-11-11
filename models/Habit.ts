import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  targetDaysPerWeek: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    targetDaysPerWeek: { type: Number, default: 7, min: 1, max: 7 },
    color: { type: String, default: "#ffffff" },
  },
  { timestamps: true }
);

HabitSchema.index({ userId: 1, createdAt: 1 });

export const Habit: Model<IHabit> =
  mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);
export default Habit;

