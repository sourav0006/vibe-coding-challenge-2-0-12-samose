import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISport extends Document {
  name: string;
  normalizedName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sportSchema = new Schema<ISport>(
  {
    name: {
      type: String,
      required: [true, "Sport name is required"],
      trim: true,
    },
    normalizedName: {
      type: String,
      required: [true, "Normalized sport name is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Automatically normalize name before validation
sportSchema.pre("validate", function () {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
});

export const SportModel: Model<ISport> =
  (mongoose.models.Sport as Model<ISport>) || mongoose.model<ISport>("Sport", sportSchema);
