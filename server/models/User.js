import mongoose from "mongoose";

// User schema — defines the shape of a user document in MongoDB
const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true }, // unique email, stored lowercase
  username: { type: String, required: true },
  password: { type: String, required: true }, // this stores the hashed password, never plain text
}, { timestamps: true }); // timestamps: true adds createdAt and updatedAt automatically

export default mongoose.model("User", userSchema);
