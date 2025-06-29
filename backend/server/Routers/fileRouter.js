import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import archiver from "archiver";

import config from "../config.js";
import { createRateLimiter } from "../utils.js";

import db from "../mongo.js";

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

fileRouter.post("/user-file-system", async (req, res) => {
  switch (req.body.type) {
    case "starting-check":
      try {
        let result = await db.getFiles({
          ownerId: req.session.userId,
          parentId: null,
        });
        if (!result || result.length == 0) {
          result = await db.createFile({
            ownerId: req.session.userId,
            type: "folder",
            name: "root",
          });
          const file_path = path.resolve(
            path.dirname(import.meta.dirname) +
              "/private/assets/user_files/" +
              req.session.userId
          );
          if (!fs.existsSync(file_path)) {
            fs.mkdirSync(file_path, { recursive: true });
          }
          return res.status(200).json({
            status: true,
            msg: "User file system initialized",
            data: {
              type: "get-root-directory",
              fileList: [],
              folderId: result._id,
            },
          });
        }
        const files = await db.getFiles({ parentId: result[0]._id });
        res.status(200).json({
          status: true,
          msg: "User file system exists",
          data: {
            type: "get-root-directory",
            fileList: files,
            folderId: result[0]._id,
          },
        });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ status: false, msg: "User file system error occurred" });
      }
      break;
    case "create-file":
      try {
        if (
          !req.body.data.name ||
          !req.body.data.type ||
          !req.body.data.parentId
        ) {
          throw new Error("Missing required fields");
        }
        let response = await db.createFile({
          ownerId: req.session.userId,
          type: req.body.data.type,
          name: req.body.data.name,
          parentId: req.body.data.parentId,
        });
        if (response.type == "file") {
          const file_path = path.resolve(
            path.dirname(import.meta.dirname) +
              "/private/assets/user_files/" +
              req.session.userId
          );
          if (!fs.existsSync(file_path)) {
            throw new Error("User file directory does not exist");
          }
          const newFilePath = path.join(
            file_path,
            response.id + path.extname(response.name)
          );
          fs.writeFileSync(newFilePath, "");
          const url = `http://${config.server.http.ip}:${
            config.server.http.port
          }/file/file-system/get-file/${
            response.id + path.extname(response.name)
          }`;
          response = await db.editFile(
            { _id: response.id },
            { URL: url, size: fs.statSync(newFilePath).size }
          );
        }
        if (!response) throw new Error("File creation failed");
        res.status(200).json({
          status: true,
          msg: "File created successfully",
          data: { type: "get-file", file: response },
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error creating folder" });
      }
      break;
    case "get-directory":
      try {
        if (!req.body.data.folderId) {
          throw new Error("Missing folderId");
        }
        const files = await db.getFiles({
          parentId: req.body.data.folderId,
          ownerId: req.session.userId,
        });
        res.status(200).json({
          status: true,
          msg: "Directory retrieved successfully",
          data: {
            type: "get-directory",
            fileList: files,
          },
        });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ status: false, msg: "Error retrieving directory" });
      }
      break;
    case "delete-file":
      try {
        if (!req.body.data.fileList || req.body.data.fileList.length == 0)
          throw new Error("No files to delete");
        if (!Array.isArray(req.body.data.fileList))
          throw new Error("fileList must be an array");

        const reqFileList = req.body.data.fileList;
        const fileList = [];
        while (reqFileList.length > 0) {
          for (const index in reqFileList) {
            if (reqFileList[index].type == "folder") {
              const childs = await db.getFiles({
                parentId: reqFileList[index]._id,
                ownerId: req.session.userId,
              });
              fileList.push(reqFileList[index]);
              reqFileList.splice(index, 1, ...childs);
              break;
            } else if (reqFileList[index].type == "file") {
              fileList.push(reqFileList[index]);
              reqFileList.splice(index, 1);
              break;
            }
          }
        }
        const result = await Promise.allSettled(
          fileList.map((file) => {
            return new Promise(async (resolve, reject) => {
              try {
                const result = await db.deleteFile({
                  _id: file._id,
                  ownerId: req.session.userId,
                });
                if (file.type == "file")
                  fs.unlinkSync(
                    path.resolve(
                      path.dirname(import.meta.dirname) +
                        "/private/assets/user_files/" +
                        req.session.userId +
                        "/" +
                        file._id +
                        path.extname(result.name)
                    )
                  );
                resolve(result);
              } catch (err) {
                reject(err);
              }
            });
          })
        );
        const sendingResult = result.map((element) => {
          if (element.status === "fulfilled") {
            return element.value;
          }
        });
        res.status(200).json({
          status: true,
          msg: "File(s) deleted",
          data: { fileList: sendingResult, type: "delete-file" },
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error deleting file" });
      }
      break;
    case "rename-file":
      try {
        if (!req.body.data.fileId || !req.body.data.name)
          throw new Error("Missing fileId or name");
        const response = await db.editFile(
          { _id: req.body.data.fileId, ownerId: req.session.userId },
          {
            name: req.body.data.name,
          }
        );
        if (!response) throw new Error("File not found or rename failed");
        res.status(200).json({
          status: true,
          msg: "File renamed successfully",
          data: {
            type: "edit-file",
            file: response,
          },
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error renaming file" });
      }
      break;
    case "move-file":
      try {
        if (!req.body.data.fileList || req.body.data.fileList.length == 0)
          throw new Error("No files to move");
        if (!Array.isArray(req.body.data.fileList))
          throw new Error("fileList must be an array");
        if (!req.body.data.folderId) throw new Error("Missing folderId");

        const result = await Promise.allSettled(
          req.body.data.fileList.map((file) => {
            return new Promise(async (resolve, reject) => {
              try {
                const updatedFile = await db.editFile(
                  { _id: file._id, ownerId: req.session.userId },
                  { parentId: req.body.data.folderId }
                );
                if (!updatedFile) throw new Error("File not found");
                resolve(updatedFile);
              } catch (err) {
                reject(err);
              }
            });
          })
        );
        const sendingResult = result.map((element) => {
          if (element.status === "fulfilled") {
            return element.value;
          }
        });
        res.status(200).json({
          status: true,
          msg: "File(s) moved",
          data: { fileList: sendingResult, type: "moved-file" },
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error moving file" });
      }
      break;
    case "copy-file":
      try {
        if (!req.body.data.fileList || req.body.data.fileList.length == 0)
          throw new Error("No files to copy");
        if (!Array.isArray(req.body.data.fileList))
          throw new Error("fileList must be an array");
        if (!req.body.data.folderId) throw new Error("Missing folderId");

        const reqFileList = req.body.data.fileList.map((file) => ({
          ...file,
          parentId: req.body.data.folderId,
        }));
        const sendingResult = [];
        const fileList = [];
        while (reqFileList.length > 0) {
          for (const index in reqFileList) {
            if (reqFileList[index].type == "folder") {
              const { _id, ...fileData } = reqFileList[index];
              const result = await db.createFile(fileData);
              const childs = await db.getFiles({
                parentId: reqFileList[index]._id,
                ownerId: req.session.userId,
              });
              reqFileList.push(
                ...childs.map((child) => ({
                  ...child._doc,
                  parentId: result._id,
                }))
              );
              reqFileList.splice(index, 1);
              if (result.parentId == req.body.data.folderId) {
                sendingResult.push(result);
              }
              break;
            } else if (reqFileList[index].type == "file") {
              fileList.push(reqFileList[index]);
              reqFileList.splice(index, 1);
              break;
            }
          }
        }
        const result = await Promise.allSettled(
          fileList.map((file) => {
            return new Promise(async (resolve, reject) => {
              try {
                if (file.type == "file") {
                  const { _id, ...fileData } = file;
                  const newFile = await db.createFile(fileData);
                  if (newFile.parentId == req.body.data.folderId) {
                    sendingResult.push(newFile);
                  }
                  fs.copyFileSync(
                    path.resolve(
                      path.dirname(import.meta.dirname) +
                        "/private/assets/user_files/" +
                        req.session.userId +
                        "/" +
                        file._id +
                        path.extname(file.name)
                    ),
                    path.resolve(
                      path.dirname(import.meta.dirname) +
                        "/private/assets/user_files/" +
                        req.session.userId +
                        "/" +
                        newFile._id +
                        path.extname(newFile.name)
                    )
                  );
                  resolve(newFile);
                }
              } catch (err) {
                reject(err);
              }
            });
          })
        );
        // const sendingResult = result.map((element) => {
        //   if (element.status === "fulfilled") {
        //     return element.value;
        //   }
        // });
        res.status(200).json({
          status: true,
          msg: "File(s) copied",
          data: { fileList: sendingResult, type: "copied-file" },
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error copying file" });
      }
      break;
    case "download-file":
      try {
        if (!req.body.data.fileList || req.body.data.fileList.length == 0)
          throw new Error("No files to download");
        if (!Array.isArray(req.body.data.fileList))
          throw new Error("fileList must be an array");

        const tempDir = path.resolve(
          path.dirname(import.meta.dirname) + "/private/temp/"
        );
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName =
          new Date().getTime() + "_" + req.session.userId + ".zip";
        const filePath = path.join(tempDir, fileName);

        const zipFile = fs.createWriteStream(filePath);

        zipFile.on("error", function (err) {
          throw new Error("Error creating zip file: " + err.message);
        });

        zipFile.on("close", function () {
          res.setHeader("Access-Control-Expose-Headers", "file-download");
          res.setHeader("file-download", "yes");
          res.download(filePath, (err) => {
            if (err) {
              console.log(err);
              res
                .status(500)
                .json({ status: false, msg: "Error sending file" });
            } else {
              fs.unlinkSync(filePath);
            }
          });
        });

        const archive = archiver("zip", {
          zlib: { level: 9 },
        });

        archive.on("error", function (err) {
          throw err;
        });

        archive.pipe(zipFile);

        const fileList = req.body.data.fileList.map((file) => ({
          ...file,
          filePath: "",
        }));
        while (fileList.length > 0) {
          console.log("===fileList===");
          console.log(fileList);
          const file = fileList.shift();
          console.log("===file===");
          console.log(file);
          if (file.type == "folder") {
            const childs = await db.getFiles({
              parentId: file._id,
              ownerId: req.session.userId,
            });
            console.log("===childs===");
            console.log(childs);
            if (childs.length === 0) {
              archive.append("", {
                name: file.filePath + "/" + file.name + "/",
              });
            }
            fileList.push(
              ...childs.map((child) => ({
                ...child._doc,
                filePath: file.filePath + "/" + file.name,
              }))
            );
          } else if (file.type == "file") {
            const filePath = path.resolve(
              path.dirname(import.meta.dirname) +
                "/private/assets/user_files/" +
                req.session.userId +
                "/" +
                file._id +
                path.extname(file.name)
            );
            if (fs.existsSync(filePath)) {
              archive.file(filePath, {
                name: file.filePath + "/" + file.name,
              });
            } else {
              console.log(`File not found: ${filePath}`);
            }
          }
        }

        archive.finalize();
      } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, msg: "Error downloading file" });
      }
      break;
    default:
      res.status(400).json({ status: false, msg: "Invalid type" });
      break;
  }
});

fileRouter.get("/file-system/get-file/:id", (req, res) => {
  const new_path = path.resolve(
    path.dirname(import.meta.dirname) +
      "/private/assets/user_files/" +
      req.session.userId +
      "/" +
      req.params.id
  );

  res.sendFile(new_path, (err) => {
    if (err) {
      console.log(err);
      console.log(new_path);
      res.status(404).end("File not found.");
    }
  });
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
