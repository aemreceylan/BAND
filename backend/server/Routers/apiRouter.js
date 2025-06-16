import express from "express";
import jwt from "jsonwebtoken";
import db from "../mongo.js";
import argon2 from "argon2";
import {
  passwordVerification,
  userAuthorization,
  emitHubSections,
  userValidation,
} from "../utils.js";

import config from "../config.js";

const apiRouter = express.Router();

apiRouter.get("/get-csrf", (req, res) => {
  res.status(200).json({
    status: true,
    msg: "csrf token created",
    csrfToken: req.csrfToken(),
  });
});

apiRouter.get("/log-out", userValidation, async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("authToken");
    res.status(200).json({ status: true, msg: "Session ended" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, msg: "Error" });
  }
});

apiRouter.post("/get-messages", userValidation, async (req, res) => {
  try {
    if (req.body.messageAmount > 50)
      throw new Error("A higher message amount was requested than allowed.");
    const data = await db.getMessages(req.body);
    res.status(200).json({
      status: true,
      msg: "Messages were fetched",
      data: data,
      isMessagesEnd: data.length < req.body.messageAmount,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: false, msg: err.message });
  }
});

apiRouter.post("/set-hub-settings", userAuthorization, async (req, res) => {
  switch (req.body.type) {
    case "add-channel":
      try {
        await db.createChannel(req.body.data);
        res.status(201).json({ status: true, msg: "Channel created" });
        emitHubSections();
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error" });
      }
      break;
    case "add-category":
      try {
        await db.createCategory(req.body.data);
        res.status(201).json({ status: true, msg: "Category created" });
        emitHubSections();
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error" });
      }
      break;
    case "edit-category":
      try {
        await db.editCategory(req.body.data);
        res.status(200).json({ status: true, msg: "Category edited" });
        emitHubSections();
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error" });
      }
      break;
    case "edit-channel":
      try {
        await db.editChannel(req.body.data);
        res.status(200).json({ status: true, msg: "Channel edited" });
        emitHubSections();
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error" });
      }
      break;
    default:
      res.status(400).json({ status: false, msg: "Invalid type" });
  }
});

apiRouter.get("/user-validation", userAuthorization, (req, res) => {
  return res
    .status(202)
    .json({ status: true, msg: "User authorization approved" });
});

apiRouter.post("/login", async (req, res) => {
  try {
    const result = await db.checkUser({ nick: req.body.nick });
    await passwordVerification(result.password, req.body.password);
    const authToken = jwt.sign({ id: result.id }, config.jwt.secret, {
      expiresIn: config.jwt.expires,
    });
    req.session.isAuth = true;
    req.session.authToken = authToken;
    req.session.cookie.maxAge = 86400000 * 2;
    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 gün
    });
    res
      .status(202)
      .json({ status: true, msg: "Login successful", authToken: authToken });
  } catch (err) {
    res.status(400).json({ status: false, msg: "Login failed = " + err });
  }
});

apiRouter.post("/signup", async (req, res) => {
  if (req.body.password != req.body.password_confirm)
    res.status(400).json({ status: false, msg: "Passwords do not match" });
  else {
    try {
      req.body.password = await argon2.hash(req.body.password, {
        hashLength: 50,
        timeCost: 4,
      });
      const { password_confirm, ..._userData } = req.body;
      await db.createUser(_userData);
      res.status(201).json({ status: true, msg: "Registration successful" });
    } catch (err) {
      res
        .status(500)
        .json({ status: false, msg: "Registration failed = " + err });
    }
  }
});

apiRouter.get("/session-check", (req, res) => {
  if (req.session.isAuth)
    res.status(200).json({
      status: true,
      message: "Session check approved",
      authToken: req.session.authToken,
    });
  else {
    res.status(401).json({ status: false, message: "Session check failed" });
  }
});

export default apiRouter;
