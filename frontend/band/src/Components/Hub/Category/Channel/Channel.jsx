import { useContext } from "react";
import "./Channel.css";
import { WSContext } from "../../../../Contexts/WSProvider";
export default function Channel({ data }) {
  const { selectedChannel, setSelectedChannel, setSelectedRTC } =
    useContext(WSContext);
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
          if (data.type == 0)
            setSelectedChannel({
              id: data._id,
              name: data.name,
            });
          else
            setSelectedRTC({
              id: data._id,
              name: data.name,
            });
        }}
      >
        <div className="hub-category-channelList-channel-title">
          <span>
            {data.type == 0 ? "#" : "+"} {data.name}
          </span>
        </div>
      </div>
    </>
  );
}
