import fs from "fs";
import Category from "./models/Category.js";
import User from "./models/User.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

import { io } from "./server.js";

import config from "./config.js";

export async function emitHubSections() {
  try {
    io.emit(
      "sectionList",
      JSON.stringify(
        await Category.find({})
          .select({ name: 1, channels: 1 })
          .populate({ path: "channels", select: ["name", "type"] })
      )
    );
  } catch (err) {
    console.log(err);
  }
}

export function passwordVerification(hash, plain) {
  return new Promise(async (resolve, reject) => {
    if (!(await argon2.verify(hash, plain))) reject("Wrong password");
    else resolve();
  });
}

export async function userAuthorization(req, res, next) {
  try {
    const id = jwt.verify(req.cookies.authToken, config.jwt.secret).id;
    const result = await User.findById(id).select({
      roles: 1,
    });
    if (result == null) {
      return res.status(404).json({ status: false, msg: "User not found" });
    } else if (!Array.from(result.roles).includes("1")) {
      return res.status(401).json({ status: false, msg: "Unauthorized user" });
    }
    next();
  } catch (err) {
    console.log(err);
    if (err.name === "TokenExpiredError") {
      req.session.destroy();
      res.clearCookie("authToken");
      return res.status(401).json({ status: false, msg: "Token expired" });
    }
    return res.status(500).json({ status: false, msg: "Authorization Error" });
  }
}

export async function userValidation(req, res, next) {
  try {
    const id = jwt.verify(req.cookies.authToken, config.jwt.secret).id;
    const result = await User.findById(id).select({ id: 1 });
    if (result == null) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }
    next();
  } catch (err) {
    console.log(err);
    if (err.name === "TokenExpiredError") {
      req.session.destroy();
      res.clearCookie("authToken");
      return res.status(401).json({ status: false, msg: "Token expired" });
    }
    return res.status(500).json({ status: false, msg: "Validation Error" });
  }
}

export function createRateLimiter(ms, _max) {
  const limiter = rateLimit({
    windowMs: ms,
    max: _max,
    statusCode: 429,
    keyGenerator: (req) => {
      return req.cookies.authToken || req.ip;
    },
    message: {
      status: false,
      msg: "Too many requests have been sent. Please try again in a few minutes.",
    },
  });
  return limiter;
}
