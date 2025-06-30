import { useContext, useRef } from "react";
import "./Video.css";
import { WSContext } from "../../../../../../Contexts/WSProvider";
export default function Video({ styles, stream, setRtcVideoFullScreen }) {
  const { userList } = useContext(WSContext);
  return (
    <>
      <div className="rtcScreen-streamRow-video" style={styles}>
        <video
          ref={(video) => {
            if (video) video.srcObject = stream.stream;
          }}
          autoPlay
          playsInline
          onClick={() => {
            if (setRtcVideoFullScreen) setRtcVideoFullScreen(stream);
          }}
        ></video>
        <div className="rtcScreen-streamRow-video-info">
          <div className="rtcScreen-streamRow-video-photo">
            <img
              src={
                userList?.get(stream.userId).profilePhotoURL ||
                "img/no-profile-photo.png"
              }
            />
          </div>
          <div className="rtcScreen-streamRow-video-nick">
            <span>{userList?.get(stream.userId).nick}</span>
          </div>
        </div>
      </div>
    </>
  );
}
