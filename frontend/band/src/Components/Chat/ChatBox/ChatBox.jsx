import { useContext } from "react";
import "./ChatBox.css";
import { WSContext } from "../../../Contexts/WSProvider";

export default function ChatBox() {
  const { selectedChannel } = useContext(WSContext);
  return (
    <>
      <div id="chatbox">
        <div id="chatbox-textarea">
          <textarea
            placeholder={`#${selectedChannel.name} kanalına mesaj gönder...`}
          ></textarea>
        </div>
        <div id="chatbox-buttons"></div>
      </div>
    </>
  );
}
