import "./Video.css";
export default function Video({ styles, stream }) {
  return (
    <>
      <div className="rtcScreen-streamRow-video" style={styles}>
        <video
          ref={(video) => {
            if (video) video.srcObject = stream.stream;
          }}
          autoPlay
          playsInline
        ></video>
        <div className="rtcScreen-streamRow-video-info">
          <div className="rtcScreen-streamRow-video-photo">
            <img src="img/no-profile-photo.png" />
          </div>
          <div className="rtcScreen-streamRow-video-nick">
            <span>{"kpdfdpfpfd"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
