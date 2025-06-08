import StreamRow from "./StreamRow/StreamRow";
import "./RtcScreen.css";
import { useContext } from "react";
import { WSContext } from "../../../../Contexts/WSProvider";
export default function RtcScreen() {
    const {consumingStreams} = useContext(WSContext)
  return (
    <>
      <div id="rtc-screen-container">
        <StreamRow streams={consumingStreams.cam} />
        <StreamRow />
      </div>
    </>
  );
}
