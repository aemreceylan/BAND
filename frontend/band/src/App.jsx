import Chat from "./Components/Chat/Chat";
import Hub from "./Components/Hub/Hub";
import HubList from "./Components/HubList/HubList";
import Users from "./Components/Users/Users";
import "./roots.css";
import "./fonts.css";
import "./App.css";
import { useContext, useEffect, useRef } from "react";
import LoginSignup from "./Components/LoginSignup/LoginSignUp";
import { WSContext } from "./Contexts/WSProvider";
import FloatingElement from "./Components/UI/FloatingElement/FloatingElement";
export default function App() {
  const { login, streams } = useContext(WSContext);

  useEffect(() => {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    if (!localStorage.getItem("categoryIsOpen"))
      localStorage.setItem("categoryIsOpen", "{}");
  }, []);
  return (
    <>
      {login ? (
        <div id="app">
          <div id="app-main">
            <HubList />
            <Hub />
            <Chat />
            <Users />
          </div>
        </div>
      ) : (
        <LoginSignup />
      )}
      {[streams.cam, streams.screen].map((element, i) => {
        if (element instanceof MediaStream)
          return (
            <FloatingElement
              coordinate={[]}
              key={i}
              styles={{
                width: "15%",
                aspectRatio: "16/9",
                backgroundColor: "black",
                border: "1px solid var(--dark-font-medium-gray)",
                borderRadius: "8px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{ width: "100%", height: "100%" }}
                className="rtcFloatingVideo-div"
              >
                <video
                  className="rtcFloatingVideo-div-video"
                  muted
                  autoPlay
                  playsInline
                  ref={(video) => {
                    if (video) video.srcObject = element;
                  }}
                  style={{ width: "100%", height: "100%" }}
                ></video>
              </div>
            </FloatingElement>
          );
      })}
    </>
  );
}
