import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  channels: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Channel",
    default:[],
  },
  authorized_roles: {
    type: [String],
    default: [0],
  },
  authorized_users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
