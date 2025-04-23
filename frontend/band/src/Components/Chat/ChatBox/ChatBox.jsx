import { useContext, useRef } from "react";
import "./ChatBox.css";
import { WSContext } from "../../../Contexts/WSProvider";

export default function ChatBox() {
  const { selectedChannel, socket, authToken } = useContext(WSContext);
  const textareaRef = useRef();
  return (
    <>
      <div id="chatbox">
        <div id="chatbox-textarea">
          <textarea
            ref={textareaRef}
            name="text"
            onKeyDown={(e) => {
              if (e.key == "Enter" && !e.shiftKey) {
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
              }
            }}
            onKeyUp={(e) => {
              if (e.key == "Enter" && !e.shiftKey) {
                textareaRef.current.value = "";
              }
            }}
            placeholder={`#${selectedChannel.name} kanalına mesaj gönder...`}
          ></textarea>
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
          </div>
        </div>
      </div>
    </>
  );
}
