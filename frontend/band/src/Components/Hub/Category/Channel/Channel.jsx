import "./Channel.css";
export default function Channel({data}) {
  return (
    <>
      <div className="hub-category-channelList-channel">
        <div className="hub-category-channelList-channel-title">
          <span># {data.name}</span>
        </div>
      </div>
    </>
  );
}
