import mongoose from "mongoose";
import User from "./models/User.js";

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
        password: data.password,
      });
      if (result == null) {
        reject("User not found");
      } else resolve(result.id);
    } catch (err) {
      console.log(err);
    }
  });
}

export default function DB() {
  return { init, createUser, checkUser };
}
