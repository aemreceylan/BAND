import express from "express";
import jwt from "jsonwebtoken";
import db from "../mongo.js";
import argon2 from "argon2";
import { randomBytes } from "crypto";

import {
  passwordVerification,
  userAuthorization,
  emitHubSections,
  userValidation,
  createRateLimiter,
} from "../utils.js";

import { userList } from "../server.js";

import config from "../config.js";

const apiRouter = express.Router();

apiRouter.post("/get-profile", async (req, res) => {
  try {
    const result = await db.getProfile(
      { _id: req.body },
      { path: "user", select: "nick profilePhotoURL" }
    );
    if (!result) throw new Error();
    res.status(201).json({
      status: true,
      msg: "Profile information was fetched successfully.",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      msg: "An error occurred while trying to retrieve profile information.",
    });
  }
});

apiRouter.post("/set-user-settings", async (req, res) => {
  switch (req.body.type) {
    case "set-profile-photo":
      try {
        await db.editUser(
          { _id: req.body.data.userId },
          { profilePhotoURL: req.body.data.photoUrl }
        );
        await userList.getUsersFromDB();
        userList.emitList();
        res.status(201).json({
          status: true,
          msg: "The uploaded image is set as profile photo",
        });
        emitHubSections();
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error" });
      }
      break;
    case "set-profile-banner":
      try {
        await db.editProfile(
          { _id: req.body.data.profileId },
          { bannerURL: req.body.data.photoUrl }
        );
        await userList.getUsersFromDB();
        userList.emitList();
        res.status(201).json({
          status: true,
          msg: "The uploaded image is set as profile banner",
        });
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

apiRouter.get("/invite/:token", async (req, res) => {
  try {
    const result = await db.getInviteLinks({ token: req.params.token });
    if (result.length > 1)
      throw new Error(
        "The amount of the returned value is greater than it should be"
      );
    if (result.length == 0) throw new Error("Invalid token");
    if (!result[0].testValid())
      throw new Error(
        "The invite link is no longer valid due to expiration or usage limit."
      );
    res.redirect(301, "http://localhost:5173?token=" + result[0].token);
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, msg: "Error" });
  }
});

apiRouter.get("/get-invite-links", userAuthorization, async (req, res) => {
  try {
    const response = await db.getInviteLinks();
    res.status(200).json({
      status: true,
      msg: "invitation links",
      data: response.map(
        (element) =>
          "http://" +
          config.server.http.ip +
          ":" +
          config.server.http.port +
          "/api/invite/" +
          element.token
      ),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, msg: "Error" });
  }
});

apiRouter.post("/create-invite-link", userAuthorization, async (req, res) => {
  try {
    const params = {};
    if (!req.body.minutes || !req.body.maxUses)
      throw new Error("Missing parameter/s.");
    if (
      req.body.maxUses < 1 ||
      req.body.maxUses > 100 ||
      req.body.minutes < 1 ||
      req.body.minutes > 43200
    )
      throw new Error("Invalid parameter/s.");
    params.maxUses = req.body.maxUses;
    params.createDate = new Date();
    params.expirationDate = new Date(
      params.createDate.getTime() + req.body.minutes * 60000
    );
    params.token = randomBytes(16).toString("hex");
    const result = await db.createInviteLink(params);
    res.status(200).json({
      status: true,
      msg: "Invite link created.",
      data:
        "http://" +
        config.server.http.ip +
        ":" +
        config.server.http.port +
        "/api/invite/" +
        result.token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, msg: "Error" });
  }
});

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

apiRouter.post(
  "/get-messages",
  createRateLimiter(1000 * 60, 40),
  userValidation,
  async (req, res) => {
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
  }
);

apiRouter.post(
  "/set-hub-settings",
  createRateLimiter(1000 * 60, 40),
  userAuthorization,
  async (req, res) => {
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
      case "remove-channel":
        try {
          await db.removeChannel(req.body.data);
          res.status(200).json({ status: true, msg: "Channel deleted" });
          emitHubSections();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "set-inviteType":
        try {
          if (
            !(
              req.body.data == "inviteOnly" ||
              req.body.data == "openRegistiration"
            )
          )
            throw new Error("Invalid invite type.");
          if (req.body.data == config.server.settings.registration.type)
            throw new Error("Type is already the same.");
          config.server.settings.registration.type = req.body.data;
          res.status(200).json({
            status: true,
            msg:
              "Invitation type changed to " +
              config.server.settings.registration.type,
          });
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "ban-client":
        try {
          await db.editUser({ _id: req.body.data }, { isBanned: true });
          res.status(201).json({ status: true, msg: "User banned" });
          await userList.getUsersFromDB();
          userList.emitList();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "admin-client":
        try {
          await db.editUser({ _id: req.body.data }, { roles: ["1"] });
          res.status(201).json({ status: true, msg: "User made admin" });
          await userList.getUsersFromDB();
          userList.emitList();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "no-admin-client":
        try {
          await db.editUser({ _id: req.body.data }, { roles: ["0"] });
          res
            .status(201)
            .json({ status: true, msg: "User demoted from admin" });
          await userList.getUsersFromDB();
          userList.emitList();
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      case "set-userFileSystem":
        try {
          if (!(req.body.data === "enabled" || req.body.data === "disabled"))
            throw new Error("Invalid userFileSystem value.");
          const currentStatus = config.server.settings.userFileSystem.status
            ? "enabled"
            : "disabled";
          if (req.body.data === currentStatus)
            throw new Error("User file system status is already the same.");
          config.server.settings.userFileSystem.status =
            req.body.data === "enabled";
          res.status(200).json({
            status: true,
            msg: "User file system status changed to " + req.body.data,
          });
        } catch (err) {
          console.log(err);
          res.status(500).json({ status: false, msg: "Error" });
        }
        break;
      default:
        res.status(400).json({ status: false, msg: "Invalid type" });
    }
  }
);

apiRouter.get(
  "/user-validation",
  createRateLimiter(1000 * 60, 40),
  userAuthorization,
  (req, res) => {
    return res
      .status(202)
      .json({ status: true, msg: "User authorization approved" });
  }
);

apiRouter.post("/login", async (req, res) => {
  try {
    const result = await db.checkUser({ nick: req.body.nick });
    if (result.isBanned) throw new Error("User banned.");
    await passwordVerification(result.password, req.body.password);
    const authToken = jwt.sign({ id: result.id }, config.jwt.secret);
    req.session.isAuth = true;
    req.session.authToken = authToken;
    req.session.cookie.maxAge = 86400000 * 2;
    req.session.profileId = result.profile;
    req.session.userId = result.id;
    req.session.profilePhotoURL = result.profilePhotoURL;
    req.session.nick = result.nick;
    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: config.server.https.status,
      sameSite: "Strict",
    });
    res.status(202).json({
      status: true,
      msg: "Login successful",
      authToken: authToken,
      profileId: result.profile,
      userId: result.id,
    });
  } catch (err) {
    res.status(400).json({ status: false, msg: "Login failed = " + err });
  }
});

apiRouter.post(
  "/signup",
  createRateLimiter(1000 * 60 * 60, 2),
  async (req, res) => {
    if (req.body.password != req.body.password_confirm)
      res.status(400).json({ status: false, msg: "Passwords do not match" });
    else {
      try {
        if (config.server.settings.registration.type == "inviteOnly") {
          if (!req.body.inviteToken)
            throw new Error("Token parameter not avaible.");
          const result = await db.getInviteLinks({
            token: req.body.inviteToken,
          });
          if (result.length > 1)
            throw new Error(
              "The amount of the returned value is greater than it should be"
            );
          if (result.length == 0) throw new Error("Invalid token");
          if (!result[0].testValid())
            throw new Error(
              "The invite link is no longer valid due to expiration or usage limit."
            );
          await result[0].incrementUses();
        }
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
  }
);

apiRouter.get("/session-check", (req, res) => {
  if (req.session.isAuth)
    res.status(200).json({
      status: true,
      message: "Session check approved",
      authToken: req.session.authToken,
      profileId: req.session.profileId,
      userId: req.session.userId,
      profilePhotoURL: req.session.profilePhotoURL,
      nick: req.session.nick,
    });
  else {
    res.status(401).json({ status: false, message: "Session check failed" });
  }
});

export default apiRouter;
