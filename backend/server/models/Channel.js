import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    default:"chat"
  },
  authorized_roles:{
    type: [String],
    default:[0]
  },
  authorized_users:{
    type:[mongoose.Schema.Types.ObjectId],
    ref:"User",
    default:[]
  }
});

const Channel = mongoose.model("Channel",channelSchema);

export default Channel;
