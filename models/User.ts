import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatar?: string;
  bio?: string;
  timezone: string;
  educationLevel?: string;
  targetExam?: string;
  theme: {
    preset: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    borderColor: string;
    cardColor: string;
    fontChoice: string;
    timerFontSize: string;
    borderRadius: number;
    showSeconds: boolean;
    clockFormat: "12h" | "24h";
    digitStyle: "normal" | "flip";
  };
  wallpaper: {
    type: "color" | "gradient" | "preset" | "image" | "video" | "youtube";
    url: string;
    overlayOpacity: number;
    blurAmount: number;
  };
  settings: {
    pomodoro: {
      focusMinutes: number;
      shortBreakMinutes: number;
      longBreakMinutes: number;
      sessionsBeforeLongBreak: number;
      autoStartBreaks: boolean;
      autoStartFocus: boolean;
    };
    sound: {
      enabled: boolean;
      soundType: string;
      volume: number;
      customSoundUrl?: string;
      customSoundName?: string;
    };
    dailyMinimumMinutes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    timezone: { type: String, default: "UTC" },
    educationLevel: { type: String, default: "" },
    targetExam: { type: String, default: "" },
    theme: {
      preset: { type: String, default: "black-white" },
      backgroundColor: { type: String, default: "#000000" },
      textColor: { type: String, default: "#ffffff" },
      accentColor: { type: String, default: "#ffffff" },
      borderColor: { type: String, default: "#262626" },
      cardColor: { type: String, default: "#0a0a0a" },
      fontChoice: { type: String, default: "Inter" },
      timerFontSize: { type: String, default: "7rem" },
      borderRadius: { type: Number, default: 12 },
      showSeconds: { type: Boolean, default: true },
      clockFormat: { type: String, enum: ["12h", "24h"], default: "24h" },
      digitStyle: { type: String, enum: ["normal", "flip"], default: "normal" },
    },
    wallpaper: {
      type: {
        type: String,
        enum: ["color", "gradient", "preset", "image", "video", "youtube"],
        default: "preset",
      },
      url: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
      },
      overlayOpacity: { type: Number, default: 0.5 },
      blurAmount: { type: Number, default: 0 },
    },
    settings: {
      pomodoro: {
        focusMinutes: { type: Number, default: 25 },
        shortBreakMinutes: { type: Number, default: 5 },
        longBreakMinutes: { type: Number, default: 15 },
        sessionsBeforeLongBreak: { type: Number, default: 4 },
        autoStartBreaks: { type: Boolean, default: false },
        autoStartFocus: { type: Boolean, default: false },
      },
      sound: {
        enabled: { type: Boolean, default: true },
        soundType: { type: String, default: "bell" },
        volume: { type: Number, default: 0.7 },
        customSoundUrl: { type: String, default: "" },
        customSoundName: { type: String, default: "" },
      },
      dailyMinimumMinutes: { type: Number, default: 15 },
    },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete (mongoose.models as any).User;
}

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;

