import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId | null;
  task: string;
  mode: "stopwatch" | "countdown" | "pomodoro";
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null, index: true },
    task: { type: String, default: "", trim: true },
    mode: {
      type: String,
      enum: ["stopwatch", "countdown", "pomodoro"],
      default: "stopwatch",
    },
    durationSeconds: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, startedAt: -1 });

export const StudySession: Model<IStudySession> =
  mongoose.models.StudySession ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);
export default StudySession;

