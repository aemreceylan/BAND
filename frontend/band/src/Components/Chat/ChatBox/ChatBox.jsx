import { useContext, useRef, useState } from "react";
import "./ChatBox.css";
import { WSContext } from "../../../Contexts/WSProvider";
import UploadedFiles from "./UploadedFiles/UploadedFiles";

export default function ChatBox() {
  const { selectedChannel, socket, authToken } = useContext(WSContext);
  const textareaRef = useRef();
  const fileUploadRef = useRef();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  return (
    <>
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
              textareaRef.current.placeholder = `Mesaja dosya eki ekle`;
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              textareaRef.current.placeholder = `#${selectedChannel.name} kanalına mesaj gönder...`;
            }}
            onDrop={(e) => {
              e.preventDefault();
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
                    const filesArray = [];
                    for (let i of uploadedFiles) {
                      filesArray.push(await i.arrayBuffer());
                    }
                    console.log(filesArray);
                    filesArray.forEach((element, i) => {
                      socket.emit(
                        "newMessageFromClient",
                        {
                          authToken: authToken,
                          text: textareaRef.current.value,
                          channelId: selectedChannel.id,
                          channelName: selectedChannel.name,
                          file: filesArray[i],
                        },
                        (data) => {
                          console.log(data);
                        }
                      );
                    });
                  }
                })();
              }}
              onKeyUp={(e) => {
                if (e.key == "Enter" && !e.shiftKey) {
                  textareaRef.current.value = "";
                }
              }}
              placeholder={`#${selectedChannel.name} kanalına mesaj gönder...`}
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
                  socket.emit(
                    "newMessageFromClient",
                    JSON.stringify({
                      authToken: authToken,
                      text: textareaRef.current.value,
                      channelId: selectedChannel.id,
                      channelName: selectedChannel.name,
                    }),
                    (data) => {
                      console.log(data);
                    }
                  );
                  textareaRef.current.value = "";
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
