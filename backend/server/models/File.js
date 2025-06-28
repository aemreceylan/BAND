import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
      index: true,
    },
    mimeType: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: null,
    },
    URL: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);

export default File;
