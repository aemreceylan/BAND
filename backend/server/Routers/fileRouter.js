import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import config from "../config.js";

const fileRouter = express.Router();

const storage = multer.diskStorage({
  filename: (req, file, cb) => cb(null, file.originalname),
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

fileRouter.post("/send-file", (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        console.log(err);
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

    res.json({
      status: true,
      msg: "Files uploaded successfully",
      data: req.files.map((file) => ({
        originalName: file.originalname,
        filePath: `http://${config.server.http.ip}:${config.server.http.port}/file/assets/client_uploads/${file.filename}`,
        size: file.size,
      })),
    });
  });
});

fileRouter.get("/*joker", (req, res) => {
  const fixed_path = path.resolve(
    path.dirname(import.meta.dirname) + "/private/" + req.url
  );
  console.log(fixed_path);

  res.sendFile(fixed_path, (err) => {
    if (err) {
      console.log(err);
      console.log(fixed_path);
      res.status(404).end("File not found.");
    }
  });
});

export default fileRouter;
