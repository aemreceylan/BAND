import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nick: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePhotoURL: {
    type: String,
    default: "",
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  lastLoginDate: {
    type: Date,
    default: null,
  },
  roles: {
    type: [String],
    default: [0],
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
