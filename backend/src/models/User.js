import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, unique: true, required: true },
    email: { type: String, lowercase: true, required: true },
    name: { type: String },
    picture: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
