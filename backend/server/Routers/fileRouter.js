import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import config from "../config.js";
import { createRateLimiter } from "../utils.js";

const fileRouter = express.Router();

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const file_path =
      path.dirname(import.meta.dirname) +
      "/private/assets/client_uploads" +
      "/";
    const ext = path.extname(file.originalname);
    let name = path.basename(file.originalname, ext);
    name = Buffer(name, "latin1").toString("utf-8");
    let new_name = name;
    let counter = 0;
    while (fs.existsSync(path.join(file_path + new_name + ext))) {
      new_name = name + `(${++counter})`;
    }
    cb(null, new_name + ext);
  },
  destination: (req, file, cb) => {
    const file_path = path.resolve(
      path.dirname(import.meta.dirname) + "/private/assets/client_uploads"
    );
    if (!fs.existsSync(file_path)) {
      fs.mkdirSync(file_path, { recursive: true });
    }
    cb(null, file_path);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 4,
  },
}).array("file", 4);

fileRouter.post("/send-file", createRateLimiter(1000 * 60, 1), (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ status: false, msg: "File size exceeds 100 MB limit" });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        console.log(err);
        return res.status(400).json({
          status: false,
          msg: "Too many files. Maximum 4 files allowed",
        });
      }
      return res.status(400).json({ status: false, msg: err.message });
    } else if (err) {
      console.log(err);
      return res.status(500).json({ status: false, msg: "File upload failed" });
    }
    if (!req.files || req.files.length === 0) {
      console.log(new Error("No files uploaded"));
      return res.status(400).json({ status: false, msg: "No files uploaded" });
    }

    let info = {};
    try {
      info = JSON.parse(req.body.info);
      let targetFolder = "";
      if (info.type === "chat") targetFolder = "chat";
      else if (info.type === "profile") targetFolder = "profile";
      else if (info.type === "userFileSystem") targetFolder = "userFileSystem";
      else throw new Error("Invalid info field");
    } catch (err) {
      console.log(err);
      return res.status(400).json({ status: false, msg: "Invalid info field" });
    }

    const movedFiles = [];
    for (const file of req.files) {
      const oldPath = file.path;
      const newDir = path.resolve(
        path.dirname(import.meta.dirname) +
          `/private/assets/client_uploads/${targetFolder}`
      );
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      const ext = path.extname(file.filename);
      let name = path.basename(file.filename, ext);
      let new_name = name;
      let counter = 0;
      let newPath = path.join(newDir, new_name + ext);
      while (fs.existsSync(newPath)) {
        new_name = name + `(${++counter})`;
        newPath = path.join(newDir, new_name + ext);
      }
      fs.renameSync(oldPath, newPath);
      movedFiles.push({
        originalName: Buffer(file.originalname, "latin1").toString("utf-8"),
        url: `http://${config.server.http.ip}:${
          config.server.http.port
        }/file/assets/client_uploads/${targetFolder}/${encodeURI(
          new_name + ext
        )}`,
        size: file.size,
      });
    }

    res.json({
      status: true,
      msg: "Files uploaded and moved successfully",
      data: movedFiles,
    });
  });
});

fileRouter.post("/user-file-system", (req, res) => {
  switch (req.body.type) {
    case "starting-check":
      break;
    default:
      res.status(400).json({ status: false, msg: "Invalid type" });
      break;
  }
});

fileRouter.get("/*joker", (req, res) => {
  const fixed_path = path.resolve(
    path.dirname(import.meta.dirname) + "/private/" + decodeURI(req.url)
  );

  res.sendFile(fixed_path, (err) => {
    if (err) {
      console.log(err);
      console.log(fixed_path);
      res.status(404).end("File not found.");
    }
  });
});

export default fileRouter;
