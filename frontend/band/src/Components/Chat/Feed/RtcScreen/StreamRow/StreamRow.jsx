import "./StreamRow.css";
import Video from "./Video/Video";
export default function StreamRow({ streams, setRtcVideoFullScreen }) {
  return (
    <>
      <div className="rtcScreen-streamRow">
        {streams?.map((element, i) => {
          console.log(element.stream)
          if (element.stream.getVideoTracks().length!=0)
            return (
              <Video
                setRtcVideoFullScreen={setRtcVideoFullScreen}
                key={i}
                styles={{ width: "20em" }}
                stream={element}
              />
            );
          else if (element.stream.getAudioTracks().length!=0)
            return (
              <audio
                style={{ display: "none" }}
                className="rtcScreen-streamRow-screenAudio"
                autoPlay
                key={i}
                ref={(audio) => {
                  if (audio) audio.srcObject = element.stream;
                }}
              ></audio>
            );
        })}
      </div>
    </>
  );
}
