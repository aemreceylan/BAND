import mongoose from "mongoose";
import User from "./models/User.js";

function init() {
  mongoose
    .connect("mongodb://localhost:27017/bandDB")
    .then(console.log("Connected to database"))
    .catch((err) => console.log(err));
}

function createUser(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const newUser = new User({
        nick: data.nick,
        password: data.password,
      });
      await newUser.save();
      resolve();
    } catch (err) {
      console.log(err);
      if (err.code == 11000) reject("Nickname in use");
    }
  });
}

function checkUser(data) {
  return new Promise((resolve, reject) => {
    User.findOne({ nick: data.nick, password: data.password })
      .then((result) => {
        if (result == null) {
          reject("User not found");
        } else resolve(result.id);
      })
      .catch((err) => console.log(err));
  });
}

export default function DB() {
  return { init, createUser, checkUser };
}
