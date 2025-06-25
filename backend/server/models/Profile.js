import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  bannerURL: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
  },
});

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
