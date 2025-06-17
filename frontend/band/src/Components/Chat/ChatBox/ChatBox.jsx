import { useContext, useEffect, useRef, useState } from "react";
import "./ChatBox.css";
import { WSContext } from "../../../Contexts/WSProvider";
import UploadedFiles from "./UploadedFiles/UploadedFiles";
import useFetch from "../../../hooks/useFetch";

export default function ChatBox() {
  const { selectedChannel, socket, authToken } = useContext(WSContext);
  const textareaRef = useRef();
  const fileUploadRef = useRef();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sendFilesRequest, sendFileData, uploading] = useFetch();

  useEffect(() => {
    if (sendFileData) {
      if (sendFileData.status) {
        socket.emit(
          "newMessageFromClient",
          {
            authToken: authToken,
            text: textareaRef.current.value,
            channelId: selectedChannel.id,
            channelName: selectedChannel.name,
            files: sendFileData.data,
          },
          (data) => {
            console.log(data);
          }
        );
      } else {
        console.log(sendFileData.msg);
      }
    }
  }, [sendFileData]);

  function emitMessage() {
    if (uploadedFiles.length > 0) {
      const formData = new FormData();
      uploadedFiles.forEach((element) => {
        formData.append("file", element, element.name);
      });
      sendFilesRequest({
        url: "file/send-file",
        method: "POST",
        body: formData,
      });
    } else {
      socket.emit(
        "newMessageFromClient",
        {
          authToken: authToken,
          text: textareaRef.current.value,
          channelId: selectedChannel.id,
          channelName: selectedChannel.name,
        },
        (data) => {
          console.log(data);
        }
      );
    }
    setUploadedFiles([]);
  }
  return (
    <>
      {isDragging && (
        <img id="chatbox-container-drop-img" src="img/drag-drop.png" />
      )}
      <div id="chatbox-container">
        <UploadedFiles
          setUploadedFiles={setUploadedFiles}
          uploadedFiles={uploadedFiles}
        />
        <div id="chatbox">
          <div
            id="chatbox-textarea"
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging((prev) => {
                if (!prev) return true;
              });
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging((prev) => {
                if (prev) return false;
              });
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging((prev) => {
                if (prev) return false;
              });
              const files = Array.from(e.dataTransfer.files).splice(0, 4);
              if (files?.length != 0)
                setUploadedFiles((prev) => [...prev, ...files]);
            }}
          >
            <textarea
              ref={textareaRef}
              name="text"
              onKeyDown={(e) => {
                (async () => {
                  if (e.key == "Enter" && !e.shiftKey) {
                    if (uploadedFiles.length > 0) emitMessage();
                    else emitMessage();
                  }
                })();
              }}
              onKeyUp={(e) => {
                if (e.key == "Enter" && !e.shiftKey) {
                  textareaRef.current.value = "";
                }
              }}
              placeholder={
                isDragging
                  ? `Mesaja dosya eki ekle`
                  : `#${selectedChannel.name} kanalına mesaj gönder...`
              }
            ></textarea>
            <input
              ref={fileUploadRef}
              style={{ display: "none" }}
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files).slice(0, 4);
                if (files?.length != 0)
                  setUploadedFiles((prev) => [...prev, ...files]);
              }}
            />
            <div id="chatbox-buttons">
              <div
                id="chatbox-buttons-send"
                onClick={() => {
                  (async () => {
                    if (uploadedFiles.length > 0) emitMessage();
                    else emitMessage();
                    textareaRef.current.value = "";
                    textareaRef.current.focus();
                  })();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z" />
                </svg>
              </div>
              <div
                id="chatbox-buttons-addFile"
                onClick={() => {
                  fileUploadRef.current.click();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M6.354 9.854a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 8.707V12.5a.5.5 0 0 1-1 0V8.707z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
