import { useContext } from "react";
import "./Channel.css";
import { WSContext } from "../../../../Contexts/WSProvider";
export default function Channel({ data }) {
  const { selectedChannel, setSelectedChannel } = useContext(WSContext);
  return (
    <>
      <div
        className="hub-category-channelList-channel"
        id={selectedChannel == data._id?"hub-category-channelList-channel-selected":""}
        onClick={() => {
          setSelectedChannel(data._id);
        }}
      >
        <div className="hub-category-channelList-channel-title">
          <span># {data.name}</span>
        </div>
      </div>
    </>
  );
}
