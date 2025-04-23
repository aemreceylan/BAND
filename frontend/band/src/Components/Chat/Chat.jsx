import Panel from "../Panel/Panel";
import Feed from "./Feed/Feed";
import ChatBox from "./ChatBox/ChatBox";
import "./Chat.css";
import { useContext } from "react";
import { WSContext } from "../../Contexts/WSProvider";

export default function Chat() {
  const { selectedChannel } = useContext(WSContext);
  return (
    <>
      <div id="chat">
        <Panel />
        <Feed />
        <ChatBox />
      </div>
    </>
  );
}
