import "./StreamRow.css";
import Video from "./Video/Video";
export default function StreamRow({ streams }) {
  return (
    <>
      <div className="rtcScreen-streamRow">
        {streams?.map((element, i) => (
          <Video key={i} styles={{ width: "20em" }} stream={element} />
        ))}
      </div>
    </>
  );
}
