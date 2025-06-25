import mongoose from "mongoose";
import Profile from "./Profile.js";

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
  isBanned: {
    type: Boolean,
    default: false,
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
});

userSchema.pre("save", async function (next) {
  try {
    console.log("sa1");
    if (this.profile) {
      console.log("sa2");
      return next();
    }
    const newProfile = await new Profile({ user: this._id }).save();
    this.profile = newProfile._id;
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
