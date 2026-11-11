import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExam extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subjectId?: mongoose.Types.ObjectId | null;
  examDate: Date;
  targetScore?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    examDate: { type: Date, required: true },
    targetScore: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

ExamSchema.index({ userId: 1, examDate: 1 });

export const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);
export default Exam;

