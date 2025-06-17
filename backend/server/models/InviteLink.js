import mongoose from "mongoose";

const inviteLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  maxUses: {
    type: Number,
    required: true,
  },
  uses: {
    type: Number,
    required: true,
    default: 0,
  },
  createDate: {
    type: Date,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
});

inviteLinkSchema.methods.incrementUses = function () {
  if (this.uses < this.maxUses) {
    this.uses += 1;
    return this.save();
  } else {
    throw new Error("Max uses limit reached");
  }
};

inviteLinkSchema.methods.testValid = function () {
  return this.uses < this.maxUses && Date.now() < this.expirationDate.getTime();
};

const InviteLink = mongoose.model("InviteLink", inviteLinkSchema);

export default InviteLink;
