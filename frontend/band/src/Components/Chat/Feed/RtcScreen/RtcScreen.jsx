import StreamRow from "./StreamRow/StreamRow";
import "./RtcScreen.css";
import { useContext, useState } from "react";
import { WSContext } from "../../../../Contexts/WSProvider";
import Video from "./StreamRow/Video/Video";
export default function RtcScreen() {
  const { consumingStreams } = useContext(WSContext);
  const [rtcVideoFullScreen, setRtcVideoFullScreen] = useState();
  return (
    <>
      <div id="rtc-screen-container">
        {rtcVideoFullScreen ? (
          <div id="rtc-screen-container-rtcVideoFullScreen-container">
            <div id="rtc-screen-container-rtcVideoFullScreen" onClick={()=>{
              setRtcVideoFullScreen();
            }}>
              <Video
                styles={{ width: "100%", height: "100%" }}
                stream={rtcVideoFullScreen}
              />
            </div>
          </div>
        ) : (
          <>
            {consumingStreams.cam.length != 0 && (
              <>
                <div className="rtc-screen-container-divider">
                  Kamera Yayınları
                </div>
                <StreamRow
                  setRtcVideoFullScreen={setRtcVideoFullScreen}
                  streams={consumingStreams.cam}
                />
              </>
            )}
            {consumingStreams.screen.length != 0 && (
              <>
                <div className="rtc-screen-container-divider">
                  Kamera Yayınları
                </div>
                <StreamRow />
              </>
            )}
            {consumingStreams.cam.length == 0 &&
              consumingStreams.screen.length == 0 && (
                <div id="rtc-screen-container-no_broadcast">
                  <img src="img/no-broadcast.png" />
                  <span>Bu kanalda kimse yayın yapmıyor gibi gözüküyor.</span>
                </div>
              )}
          </>
        )}
      </div>
    </>
  );
}
