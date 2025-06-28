import "./UserFileSystemScreen.css";
import UserFileSystemElement from "./UserFileSystemRow/UserFileSystemElemenent";
import Modal from "../../../UI/Modal/Modal";
import { useEffect, useState, useContext } from "react";
import { WSContext } from "../../../../Contexts/WSProvider";

export default function UserFileSystemScreen() {
  const { handleUserFileSystem, userFileSystemData } = useContext(WSContext);
  const [selectedStyle, setSelectedStyle] = useState("list");
  const [fileList, setFileList] = useState();
  const [folderId, setFolderId] = useState();
  const [folderPath, setFolderPath] = useState([]);
  const [newFile, setNewFile] = useState();
  const [isSelecting, setIsSelecting] = useState();

  useEffect(() => {
    if (!folderId) handleUserFileSystem("starting-check");
  }, []);

  useEffect(() => {
    if (isSelecting == false) {
      const map = new Map(fileList);
      map.forEach((value, key) => {
        map.set(key, {
          ...value,
          isSelected: false,
        });
      });
      setFileList(map);
    }
  }, [isSelecting]);

  useEffect(() => {
    if (userFileSystemData) {
      if (userFileSystemData.status) {
        switch (userFileSystemData.data.type) {
          case "get-root-directory": {
            const map = new Map();
            userFileSystemData.data.fileList.forEach((element) =>
              map.set(element._id, {
                ...element,
                isSelected: false,
              })
            );
            setFileList(map);
            setFolderId(userFileSystemData.data.folderId);
            setFolderPath([
              { name: "root", id: userFileSystemData.data.folderId },
            ]);
            break;
          }
          case "get-file": {
            const map = new Map(fileList);
            map.set(userFileSystemData.data.file._id, {
              ...userFileSystemData.data.file,
              isSelected: false,
            });
            setFileList(map);
            break;
          }
          case "get-directory": {
            const map = new Map();
            userFileSystemData.data.fileList.forEach((element) =>
              map.set(element._id, {
                ...element,
                isSelected: false,
              })
            );
            setFileList(map);
            break;
          }
          case "delete-file": {
            const map = new Map(fileList);
            userFileSystemData.data.fileList.forEach((element) => {
              map.delete(element._id);
            });
            setFileList(map);
            break;
          }
          default: {
            console.error(
              "Unknown type in userFileSystemData:",
              userFileSystemData.data.type
            );
            return;
          }
        }
      }
      console.log(userFileSystemData.msg);
    }
  }, [userFileSystemData]);

  return (
    <>
      <div id="userFileSystem-container">
        <div id="userFileSystem">
          <div id="userFileSystem-topBar">
            <div id="userFileSystem-topBar-path">
              <div
                id="userFileSystem-topBar-path-icon"
                onClick={() => {
                  setFolderId(folderPath[0].id);
                  setFolderPath([folderPath[0]]);
                  handleUserFileSystem("get-directory", {
                    folderId: folderPath[0].id,
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1rem"
                  height="1rem"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z" />
                  <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293z" />
                </svg>
              </div>
              <div id="userFileSystem-topBar-path-path">
                <span>
                  {folderPath?.map((element, i) => {
                    if (element.name != "root")
                      return (
                        <span
                          className="userFileSystem-topBar-path-element"
                          key={i}
                          onClick={() => {
                            setFolderId(element.id);
                            setIsSelecting(false);
                            setFolderPath(folderPath.slice(0, i + 1));
                            handleUserFileSystem("get-directory", {
                              folderId: element.id,
                            });
                          }}
                        >
                          {" / "}
                          {element.name}
                        </span>
                      );
                  })}
                </span>
              </div>
            </div>
            <div id="userFileSystem-topBar-style">
              <div
                id="userFileSystem-topBar-style-list"
                className={
                  selectedStyle === "list"
                    ? "userFileSystem-topBar-style-selected"
                    : ""
                }
                title="Liste Görünümü"
                onClick={() => setSelectedStyle("list")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
                  />
                </svg>
              </div>
              <div
                id="userFileSystem-topBar-style-grid"
                title="Izgara Görünümü"
                className={
                  selectedStyle === "grid"
                    ? "userFileSystem-topBar-style-selected"
                    : ""
                }
                onClick={() => setSelectedStyle("grid")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z" />
                </svg>
              </div>
            </div>
            <div id="userFileSystem-topBar-new">
              <div
                id="userFileSystem-topBar-new-folder-button"
                title="Yeni Klasör Oluştur"
                onClick={() => {
                  setNewFile("folder");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1rem"
                  height="1rem "
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="m.5 3 .04.87a2 2 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2m5.672-1a1 1 0 0 1 .707.293L7.586 3H2.19q-.362.002-.683.12L1.5 2.98a1 1 0 0 1 1-.98z" />
                  <path d="M13.5 9a.5.5 0 0 1 .5.5V11h1.5a.5.5 0 1 1 0 1H14v1.5a.5.5 0 1 1-1 0V12h-1.5a.5.5 0 0 1 0-1H13V9.5a.5.5 0 0 1 .5-.5" />
                </svg>
              </div>
              <div
                id="userFileSystem-topBar-new-file-button"
                title="Yeni Dosya Oluştur"
                onClick={() => {
                  setNewFile("file");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1rem"
                  height="1rem"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M8.5 7v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 1 0" />
                </svg>
              </div>
            </div>
          </div>
          <div id="userFileSystem-files">
            {isSelecting && (
              <div id="userFileSystem-selecting">
                <div
                  id="userFileSystem-selecting-cancel"
                  onClick={() => {
                    setIsSelecting(false);
                  }}
                >
                  <span>X</span>
                </div>
                <div id="userFileSystem-selecting-count">
                  <span>
                    {
                      Array.from(fileList.values()).filter(
                        (file) => file.isSelected
                      ).length
                    }{" "}
                    öğe seçildi
                  </span>
                </div>
                <div id="userFileSystem-selecting-operators">
                  <div id="userFileSystem-selecting-operators-download-button">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                    </svg>
                  </div>
                  <div id="userFileSystem-selecting-operators-move-button">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10M.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8"
                      />
                    </svg>
                  </div>
                  <div id="userFileSystem-selecting-operators-rename-button">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                      <path
                        fillRule="evenodd"
                        d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                      />
                    </svg>
                  </div>
                  <div
                    id="userFileSystem-selecting-operators-delete-button"
                    onClick={() => {
                      const deleteList = Array.from(fileList.values()).filter(
                        (file) => file.isSelected
                      );
                      if (deleteList.length > 0) {
                        handleUserFileSystem("delete-file", {
                          fileList: deleteList.map((file) => file._id),
                        });
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            <div
              id={
                selectedStyle == "list"
                  ? "userFileSystem-files-list"
                  : selectedStyle == "grid"
                  ? "userFileSystem-files-grid"
                  : null
              }
            >
              {newFile && (
                <Modal
                  backdropStyle={{
                    backgroundColor: "rgba(0,0,0,0.5)",
                    top: "0",
                    left: "0",
                    height: "100vh",
                    width: "100vw",
                    position: "fixed",
                  }}
                  close={{
                    backdrop: () => {
                      setNewFile(null);
                    },
                  }}
                >
                  <div
                    id="modal-new"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setNewFile(null);
                      }
                    }}
                  >
                    <form
                      id="modal-new-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        let formData = new FormData(e.target);
                        formData.append("type", newFile);
                        formData.append("parentId", folderId);
                        formData = Object.fromEntries(formData.entries());
                        handleUserFileSystem("create-file", formData);
                        setNewFile(null);
                      }}
                    >
                      <input
                        name="name"
                        autoFocus
                        required
                        id="modal-new-input-name"
                        type="text"
                        placeholder={
                          newFile == "folder" ? "Klasör Adı" : "Dosya Adı"
                        }
                      />
                      <button type="submit" id="modal-new-button">
                        {newFile == "folder"
                          ? "Yeni Klasör Oluştur"
                          : "Yeni Dosya Oluştur"}
                      </button>
                    </form>
                    <div
                      id="modal-new-close"
                      onClick={() => {
                        setNewFile(null);
                      }}
                    >
                      X
                    </div>
                  </div>
                </Modal>
              )}
              {selectedStyle == "list" && (
                <UserFileSystemElement
                  data={{
                    list: [
                      ["Adı", { width: "70%" }],
                      ["Boyutu", { width: "15%" }],
                      ["Son Değiştirme Tarihi", { width: "15%" }],
                    ],
                    isHeader: true,
                    type: selectedStyle,
                    file: {},
                  }}
                />
              )}
              {!fileList || fileList.size == 0 ? (
                <div id="userFileSystem-no-files"> Bu dizin boş.</div>
              ) : (
                Array.from(fileList.values())?.map((file, i) => (
                  <UserFileSystemElement
                    key={i}
                    data={{
                      list: [
                        [file.name, { width: "70%" }],
                        [file.size, { width: "15%", justifyContent: "center" }],
                        [
                          `${new Date(file.updatedAt)
                            .getDate()
                            .toString()
                            .padStart(2, "0")}.${(
                            new Date(file.updatedAt).getMonth() + 1
                          )
                            .toString()
                            .padStart(2, "0")}.${new Date(
                            file.updatedAt
                          ).getFullYear()}`,
                          { width: "15%", justifyContent: "center" },
                        ],
                      ],
                      type: selectedStyle,
                      folderId: folderId,
                      file: file,
                    }}
                    setFileList={setFileList}
                    setIsSelecting={setIsSelecting}
                    isSelecting={isSelecting}
                    handleUserFileSystem={handleUserFileSystem}
                    setFolderPath={setFolderPath}
                    setFolderId={setFolderId}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
