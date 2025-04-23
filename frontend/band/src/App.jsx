import Chat from "./Components/Chat/Chat";
import Hub from "./Components/Hub/Hub";
import HubList from "./Components/HubList/HubList";
import Users from "./Components/Users/Users";
import "./roots.css";
import "./fonts.css";
import "./App.css";
import { useContext, useEffect } from "react";
import LoginSignup from "./Components/LoginSignup/LoginSignUp";
import { WSContext } from "./Contexts/WSProvider";
import Modal from "./Components/UI/Modal/Modal";

export default function App() {
  useEffect(() => {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);

  const { login, selectedRTC, setSelectedRTC } = useContext(WSContext);

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
      {selectedRTC.id && (
        <Modal
          backdropStyle={{ display: "none" }}
          style={{
            left: "1rem",
            bottom: "1rem",
            top: "initial",
            transform: "initial",
          }}
        >
          <div id="RTC-panel">
            <div id="RTC-panel-content">
              {selectedRTC.isConnected ? (
                <div
                  id="close"
                  onClick={() => {
                    setSelectedRTC((prev) => ({
                      ...prev,
                      isConnected: false,
                    }));
                  }}
                >
                  <span>x</span>
                </div>
              ) : (
                <div id="RTC-panel-connecting-screen">
                  <div id="RTC-panel-connecting-screen-info">
                    <span>
                      {selectedRTC.name} kanalına bağlanmak istiyor musun?
                    </span>
                  </div>
                  <div id="RTC-panel-connecting-screen-buttons">
                    <div
                      id="RTC-panel-connecting-screen-buttons-button-connect"
                      onClick={() => {
                        setSelectedRTC((prev) => ({
                          ...prev,
                          isConnected: true,
                        }));
                      }}
                    >
                      <span>Evet</span>
                    </div>
                    <div
                      id="RTC-panel-connecting-screen-buttons-button-dtconnect"
                      onClick={() => {
                        setSelectedRTC({
                          id: "",
                          name: "",
                        });
                      }}
                    >
                      <span>Hayır</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
