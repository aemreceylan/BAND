import mongoose from "mongoose";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Category from "./models/Category.js";
import Message from "./models/Message.js";

const db = (() => {
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
        const result = await User.findOne(data);
        if (result == null) reject("User not found");
        resolve(result);
      } catch (err) {
        console.log(err);
        reject("Error");
      }
    });
  }

  function createChannel(data) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!(Number(data.type) == 0 || Number(data.type) == 1))
          throw new Error();
        const newChannel = new Channel({
          name: data.name,
          type: data.type,
        });
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
      const query = {
        text: data.text,
        sender: data.userId,
        channel: data.channelId,
      };
      if (data.file) {
        query.file = [data.file.originalName, data.file.filePath, data.file.size];
      }
      const newMessage = new Message(query);
      try {
        if ((await Channel.findById(data.channelId)).type != 0)
          throw new Error();
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

  function getMessages({
    channelId,
    messageAmount: limit,
    skip,
    firstMessage,
  }) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!channelId) throw new Error("channelId value is empty");

        const findObject = { channel: channelId };
        if (firstMessage)
          findObject.timestamp = { $lt: firstMessage.timestamp };
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

  function editCategory(data) {
    return new Promise(async (resolve, reject) => {
      try {
        await Category.findByIdAndUpdate(data.categoryId, {
          $set: { name: data.name },
        });
        resolve();
      } catch (err) {
        console.log(err);
        reject();
      }
    });
  }

  function editChannel(data) {
    return new Promise(async (resolve, reject) => {
      try {
        await Channel.findByIdAndUpdate(data.channelId, {
          $set: { name: data.name },
        });
        resolve();
      } catch (err) {
        console.log(err);
        reject();
      }
    });
  }

  function isRtcChannel(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await Channel.findOne({ ...data, type: 1 });
        if (result) resolve(true);
        else resolve(false);
      } catch (err) {
        reject(err);
      }
      i;
    });
  }
  return {
    init,
    createUser,
    checkUser,
    createChannel,
    createCategory,
    newMessage,
    getMessages,
    editCategory,
    editChannel,
    isRtcChannel,
  };
})();

export default db;

export function msDB() {
  const getRtcChannelList = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await Channel.find({ type: 1 });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };
  return { getRtcChannelList };
}
