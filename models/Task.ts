import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  completed: boolean;
  subjectId?: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, completed: 1, createdAt: -1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
export default Task;

