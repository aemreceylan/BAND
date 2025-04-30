import { useContext } from "react";
import "./Channel.css";
import { WSContext } from "../../../../Contexts/WSProvider";
export default function Channel({ data }) {
  const {
    selectedChannel,
    setSelectedChannel,
    selectedRTC,
    setSelectedRTC,
    activeRTC,
    setActiveRTC,
  } = useContext(WSContext);
  return (
    <>
      <div
        className="hub-category-channelList-channel"
        id={
          selectedChannel.id == data._id ||
          (selectedRTC.id == data._id && activeRTC.id != data._id)
            ? "hub-category-channelList-channel-selected"
            : activeRTC.id == data._id
            ? "hub-category-channelList-channel-active"
            : ""
        }
        onClick={() => {
          if (data.type == 0) {
            if (activeRTC.screen)
              setActiveRTC((prev) => ({ ...prev, screen: false }));
            if (selectedChannel.id != data._id)
              setSelectedChannel({
                id: data._id,
                name: data.name,
              });
          } else if (data.type == 1) {
            if (activeRTC.id != data._id)
              setSelectedRTC({
                id: data._id,
                name: data.name,
              });
          }
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
