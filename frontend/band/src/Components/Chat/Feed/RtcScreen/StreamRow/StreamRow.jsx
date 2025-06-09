import "./StreamRow.css";
import Video from "./Video/Video";
export default function StreamRow({ streams, setRtcVideoFullScreen }) {
  return (
    <>
      <div className="rtcScreen-streamRow">
        {streams?.map((element, i) => (
          <Video
            setRtcVideoFullScreen={setRtcVideoFullScreen}
            key={i}
            styles={{ width: "20em" }}
            stream={element}
          />
        ))}
      </div>
    </>
  );
}
