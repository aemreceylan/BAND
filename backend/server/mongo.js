import argon2 from "argon2";
import mongoose from "mongoose";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Category from "./models/Category.js";
import Message from "./models/Message.js";
async function init() {
  try {
    await mongoose.connect("mongodb://localhost:27017/bandDB");
    console.log("Connected to database");
  } catch (err) {
    console.log(err);
  }
}

function createUser(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const newUser = new User({
        nick: data.nick,
        password: data.password,
      });
      const count = await User.countDocuments({});
      if (count == 0) newUser.roles = [1];
      await newUser.save();
      resolve();
    } catch (err) {
      console.log(err);
      if (err.code == 11000) reject("Nickname in use");
    }
  });
}

function checkUser(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await User.findOne({
        nick: data.nick,
      });
      if (result == null) reject("User not found");
      else if (! await argon2.verify(result.password, data.password))
        reject("Wrong password");
      else resolve(result.id);
    } catch (err) {
      console.log(err);
    }
  });
}

function createChannel(data) {
  return new Promise(async (resolve, reject) => {
    const newChannel = new Channel({
      name: data.name,
    });
    try {
      const channel = await newChannel.save();
      await Category.findByIdAndUpdate(data.categoryId, {
        $push: { channels: channel._id },
      });
      resolve();
    } catch (err) {
      console.log(err);
      reject();
    }
  });
}

function createCategory(data) {
  return new Promise(async (resolve, reject) => {
    const newCategory = new Category({
      name: data.name,
    });
    try {
      await newCategory.save();
      resolve();
    } catch (err) {
      console.log(err);
      reject();
    }
  });
}

function newMessage(data) {
  return new Promise(async (resolve, reject) => {
    const newMessage = new Message({
      text: data.text,
      sender: data.userId,
      channel: data.channelId,
    });
    try {
      const response = await newMessage.save();
      const message = await (
        await response.populate({
          path: "sender",
          select: { nick: 1, _id: 0 },
        })
      ).populate({ path: "channel", select: { name: 1 } });
      resolve(message._doc);
    } catch (err) {
      console.log(err);
      reject();
    }
  });
}

function getMessages({ channelId, messageAmount: limit, skip, firstMessage }) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!channelId) throw new Error("channelId value is empty");

      const findObject = { channel: channelId };
      if (firstMessage) findObject.timestamp = { $lt: firstMessage.timestamp };
      const result = await Message.find(findObject)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "sender", select: { nick: 1, _id: 0 } })
        .populate({ path: "channel", select: { name: 1 } });

      resolve(result.reverse());
    } catch (err) {
      console.log(err);
      reject("Err");
    }
  });
}

export default function DB() {
  return {
    init,
    createUser,
    checkUser,
    createChannel,
    createCategory,
    newMessage,
    getMessages,
  };
}
