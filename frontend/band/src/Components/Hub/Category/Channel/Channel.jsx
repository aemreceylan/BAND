import { useContext } from "react";
import "./Channel.css";
import { WSContext } from "../../../../Contexts/WSProvider";
export default function Channel({ data }) {
  const { selectedChannel, setSelectedChannel } = useContext(WSContext);
  return (
    <>
      <div
        className="hub-category-channelList-channel"
        id={
          selectedChannel.id == data._id
            ? "hub-category-channelList-channel-selected"
            : ""
        }
        onClick={() => {
          setSelectedChannel({ id: data._id, name: data.name });
        }}
      >
        <div className="hub-category-channelList-channel-title">
          <span># {data.name}</span>
        </div>
      </div>
    </>
  );
}
