import Category from "./Category/Category";
import Panel from "../Panel/Panel";
import "./Hub.css";
import { useContext, useEffect, useRef, useState } from "react";
import Modal from "../UI/Modal/Modal";
import { WSContext } from "../../Contexts/WSProvider";
import useUserValidation from "../../hooks/useUserValidation.js";
import useFetch from "../../hooks/useFetch.js";

function RtcModal({ children }) {
  return (
    <>
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
          <div id="RTC-panel-content">{children}</div>
        </div>
      </Modal>
    </>
  );
}

export default function Hub() {
  const {
    authToken,
    sectionList,
    selectedRTC,
    setSelectedRTC,
    activeRTC,
    setRtcScreen,
    setSelectedChannel,
    rtcMediaSettings,
    setRtcMediaSettings,
    setStreams,
    streams,
    publish,
    socket,
    disconnect,
    isDisconnect,
    getStreams,
    consumingStreams,
    closeProduce,
  } = useContext(WSContext);
  const [isOpen, setIsOpen] = useState(true);
  const [settingsPanelIsOpen, setSettingsPanelIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [isApproved, setIsApproved] = useState(false);
  const [userValidation, userValidationResult] = useUserValidation();
  const [hubSettingsRequest, hubSettingsRequestData] = useFetch();
  const [selectedCategoryOption, setSelectedCategoryOption] = useState();
  const [rtcDevices, setRtcDevices] = useState();
  const camVideoRef = useRef();
  const micAudioRef = useRef();

  useEffect(() => {
    if (!selectedCategoryOption && sectionList && sectionList.length > 0)
      setSelectedCategoryOption(sectionList[0]._id);
  }, [sectionList]);

  useEffect(() => {
    if (settingsPanelIsOpen && selectedOption == 0) {
      (async () => {
        try {
          const camVideoTestStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: "default" },
          });
          setStreams((prev) => ({ ...prev, camVideoTest: camVideoTestStream }));
          const micAudioTestStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              deviceId: "default",
            },
          });
          setStreams((prev) => ({ ...prev, micAudioTest: micAudioTestStream }));
          setRtcDevices(await navigator.mediaDevices.enumerateDevices());
        } catch (err) {
          console.log(err);
        }
      })();
    } else if (!settingsPanelIsOpen) {
      if (streams.camVideoTest) {
        streams.camVideoTest.getTracks().forEach((element) => element.stop());
        setStreams((prev) => {
          const { camVideoTest, ...other } = prev;
          return other;
        });
        if (camVideoRef.current) camVideoRef.current.srcObject = null;
      }
      if (streams.micAudioTest) {
        streams.micAudioTest.getTracks().forEach((element) => element.stop());
        setStreams((prev) => {
          const { micAudioTest, ...other } = prev;
          return other;
        });
        if (micAudioRef.current) micAudioRef.current.srcObject = null;
      }
    }
  }, [settingsPanelIsOpen, selectedOption]);

  useEffect(() => {
    if (settingsPanelIsOpen && selectedOption == 0) {
      (async () => {
        try {
          if (streams.camVideoTest) {
            streams.camVideoTest
              .getTracks()
              .forEach((element) => element.stop());
            setStreams((prev) => {
              const { camVideoTest, ...other } = prev;
              return other;
            });
            if (camVideoRef.current) camVideoRef.current.srcObject = null;
          }
          if (streams.micAudioTest) {
            streams.micAudioTest
              .getTracks()
              .forEach((element) => element.stop());
            setStreams((prev) => {
              const { micAudioTest, ...other } = prev;
              return other;
            });
            if (micAudioRef.current) micAudioRef.current.srcObject = null;
          }
          const camVideoTestStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: rtcMediaSettings.cam.id },
          });
          setStreams((prev) => ({ ...prev, camVideoTest: camVideoTestStream }));
          const micAudioTestStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              deviceId: rtcMediaSettings.mic.id,
            },
          });
          setStreams((prev) => ({ ...prev, micAudioTest: micAudioTestStream }));
        } catch (err) {
          console.log(err);
        }
      })();
    }
    if (
      rtcMediaSettings.mic.info &&
      !rtcMediaSettings.mic.open &&
      rtcMediaSettings.mic.status
    ) {
      (async () => {
        await closeProduce(rtcMediaSettings.mic.info.key, socket);
        setRtcMediaSettings((prev) => {
          const temp = { ...prev.mic };
          delete temp.info;
          return { ...prev, mic: temp };
        });
        setStreams((prev) => {
          const temp = { ...prev };
          delete temp.audio;
          return temp;
        });
        rtcMediaSettings.mic.status = false;
      })();
    }
    if (
      rtcMediaSettings.cam.info &&
      !rtcMediaSettings.cam.open &&
      rtcMediaSettings.cam.status
    ) {
      (async () => {
        await closeProduce(rtcMediaSettings.cam.info.key, socket);
        setRtcMediaSettings((prev) => {
          const temp = { ...prev.cam };
          delete temp.info;
          return { ...prev, cam: temp };
        });
        setStreams((prev) => {
          const temp = { ...prev };
          delete temp.cam;
          return temp;
        });
        rtcMediaSettings.cam.status = false;
      })();
    }
    if (
      rtcMediaSettings.screen.info &&
      !rtcMediaSettings.screen.open &&
      rtcMediaSettings.screen.status
    ) {
      (async () => {
        await closeProduce(rtcMediaSettings.cam.info.key, socket);
        setRtcMediaSettings((prev) => {
          const temp = { ...prev.cam };
          delete temp.info;
          return { ...prev, cam: temp };
        });
        setStreams((prev) => {
          const temp = { ...prev };
          delete temp.cam;
          return temp;
        });
        rtcMediaSettings.cam.status = false;
      })();
    }
  }, [rtcMediaSettings]);

  useEffect(() => {
    if (
      settingsPanelIsOpen &&
      selectedOption == 0 &&
      (camVideoRef.current || micAudioRef.current)
    ) {
      if (streams.camVideoTest)
        camVideoRef.current.srcObject = streams.camVideoTest;
      if (streams.micAudioTest)
        micAudioRef.current.srcObject = streams.micAudioTest;
    }
    if (
      streams.audio &&
      rtcMediaSettings.mic.open &&
      !rtcMediaSettings.mic.status
    ) {
      (async () => {
        const data = await publish(streams.audio, "audio");
        setRtcMediaSettings((prev) => ({
          ...prev,
          mic: {
            ...prev.mic,
            info: data,
            status: true,
          },
        }));
      })();
    }
    if (
      streams.cam &&
      rtcMediaSettings.cam.open &&
      !rtcMediaSettings.cam.status
    ) {
      (async () => {
        const data = await publish(streams.cam, "cam");
        setRtcMediaSettings((prev) => ({
          ...prev,
          cam: {
            ...prev.cam,
            info: data,
            status: true,
          },
        }));
      })();
    }
  }, [streams]);

  useEffect(() => {
    if (selectedOption == 1) {
      userValidation(authToken);
    }
  }, [selectedOption]);

  useEffect(() => {
    setIsApproved(userValidationResult);
  }, [userValidationResult]);

  useEffect(() => {
    if (hubSettingsRequestData) {
      if (hubSettingsRequestData.status) {
        console.log(hubSettingsRequestData.msg);
      }
    }
  }, [hubSettingsRequestData]);

  function setHubSettings(type, data) {
    hubSettingsRequest({
      url: "set-hub-settings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: authToken,
      },
      body: JSON.stringify({ type: type, data: data }),
    });
  }

  return (
    <>
      <div id="hub" className={!isOpen ? "hub-closed" : ""}>
        <Panel>
          <div id="hub-panel">
            <div id="hub-panel-title">{"HUB"}</div>
            <div id="hub-panel-buttons">
              <div
                id="hub-panel-buttons-settings"
                onClick={() => {
                  setSettingsPanelIsOpen(true);
                }}
                title="Sunucu Ayarları"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                </svg>
              </div>
              <div
                id="hub-panel-buttons-frame"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                {isOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5M10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8m-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </Panel>
        <div id="hub-categories">
          {sectionList?.map((element, index) => (
            <Category key={index} data={element} />
          ))}
        </div>
      </div>
      {settingsPanelIsOpen && (
        <Modal
          backdropStyle={{
            backgroundColor: "var(--dark-background-dark-gray)",
          }}
        >
          <div id="hubSettings-container">
            <div id="hubSettings-container-option-buttons">
              <div
                id="hubSettings-container-closeButton"
                onClick={() => setSettingsPanelIsOpen(false)}
              >
                X
              </div>
              <div
                className={`hubSettings-container-option-button ${
                  selectedOption == 0
                    ? "hubSettings-container-option-button-selected"
                    : ""
                }`}
                id="hubSettings-container-option-buttons-personal"
                onClick={() => setSelectedOption(0)}
              >
                <span>Kişisel Ayarlar</span>
              </div>
              <div
                className={`hubSettings-container-option-button ${
                  selectedOption == 1
                    ? "hubSettings-container-option-button-selected"
                    : ""
                }`}
                id="hubSettings-container-option-buttons-hub"
                onClick={() => setSelectedOption(1)}
              >
                <span>Hub Ayarları</span>
              </div>
            </div>
            <div id="hubSettings-container-content">
              {selectedOption == 0 ? (
                <div id="hubSettings-container-content-personalSettings">
                  <div className="hubSettings-container-divider">
                    RTC Ayarları
                  </div>
                  <div
                    id="hubSettings-container-content-personalSettings-audioSettings"
                    className="hubSettings-settingContainer"
                  >
                    <form
                      id="audioSettings-form"
                      onInput={(e) => {
                        setRtcMediaSettings((prev) => ({
                          ...prev,
                          [e.target.name]: {
                            ...prev[e.target.name],
                            id: e.target.value,
                          },
                        }));
                      }}
                    >
                      <select name="mic">
                        {rtcDevices?.map((element, i) => {
                          if (element.kind == "audioinput")
                            return (
                              <option key={i} value={element.deviceId}>
                                {element.label}
                              </option>
                            );
                        })}
                      </select>
                      <select name="listen">
                        {rtcDevices?.map((element, i) => {
                          if (element.kind == "audiooutput")
                            return (
                              <option key={i} value={element.deviceId}>
                                {element.label}
                              </option>
                            );
                        })}
                      </select>
                      <select name="cam">
                        {rtcDevices?.map((element, i) => {
                          if (element.kind == "videoinput")
                            return (
                              <option key={i} value={element.deviceId}>
                                {element.label}
                              </option>
                            );
                        })}
                      </select>
                    </form>
                  </div>
                  <div id="hubSettings-container-content-personalSettings-cam">
                    <video
                      autoPlay
                      playsInline
                      ref={camVideoRef}
                      id="hubSettings-container-content-personalSettings-cam-test"
                    ></video>
                  </div>
                  <div id="hubSettings-container-content-personalSettings-mic">
                    <audio
                      ref={micAudioRef}
                      id="hubSettings-container-content-personalSettings-mic-test"
                      autoPlay
                    ></audio>
                  </div>
                </div>
              ) : selectedOption == 1 && !isApproved ? (
                "Burayı görmeye yetkiniz yok"
              ) : selectedOption == 1 && isApproved ? (
                <>
                  <div id="hubSettings-container-content-hubSettings">
                    <div className="hubSettings-container-divider">
                      Kategori Ayarları
                    </div>
                    <div
                      id="hubSettings-container-content-hubSettings-addCategory"
                      className="hubSettings-settingContainer"
                    >
                      <form
                        id="addCategory-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          let formData = new FormData(e.target);
                          formData = Object.fromEntries(formData.entries());
                          setHubSettings("add-category", formData);
                        }}
                      >
                        <label htmlFor="addCategory-input">
                          {" "}
                          Kategori Ekle
                        </label>
                        <input type="text" id="addCategory-input" name="name" />
                        <button type="submit">EKLE</button>
                      </form>
                    </div>
                    <div
                      id="hubSettings-container-content-hubSettings-editCategory"
                      className="hubSettings-settingContainer"
                    >
                      <form
                        id="editCategory-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          let formData = new FormData(e.target);
                          formData = Object.fromEntries(formData.entries());
                          setHubSettings("edit-category", formData);
                        }}
                      >
                        <label htmlFor="editCategory-input">
                          Kategoriyi Düzenle
                        </label>
                        <select name="categoryId">
                          {sectionList?.map((element, index) => (
                            <option key={index} value={element._id}>
                              {element.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          id="editCategory-input"
                          name="name"
                        />
                        <button type="submit">DÜZENLE</button>
                      </form>
                    </div>
                    <div className="hubSettings-container-divider">
                      Kanal Ayarları
                    </div>
                    <div
                      id="hubSettings-container-content-hubSettings-addChannel"
                      className="hubSettings-settingContainer"
                    >
                      <form
                        id="addChannel-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          let formData = new FormData(e.target);
                          formData = Object.fromEntries(formData.entries());
                          setHubSettings("add-channel", formData);
                        }}
                      >
                        <label htmlFor="addChannel-input">Kanal Ekle</label>
                        <select name="categoryId">
                          {sectionList?.map((element, index) => (
                            <option key={index} value={element._id}>
                              {element.name}
                            </option>
                          ))}
                        </select>
                        <input type="text" id="add-channel-input" name="name" />
                        <select name="type">
                          <option value="0">Chat</option>
                          <option value="1">RTC</option>
                        </select>
                        <button type="submit">EKLE</button>
                      </form>
                    </div>
                    <div
                      id="hubSettings-container-content-hubSettings-addChannel"
                      className="hubSettings-settingContainer"
                    >
                      <form
                        id="editChannel-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          let formData = new FormData(e.target);
                          formData = Object.fromEntries(formData.entries());
                          setHubSettings("edit-channel", formData);
                        }}
                      >
                        <label htmlFor="editChannel-input">Kanal Düzenle</label>
                        <select
                          onInput={(e) => {
                            setSelectedCategoryOption(e.target.value);
                          }}
                        >
                          {sectionList?.map((element, index) => (
                            <option key={index} value={element._id}>
                              {element.name}
                            </option>
                          ))}
                        </select>
                        <select name="channelId">
                          {sectionList?.map(
                            (element) =>
                              element._id == selectedCategoryOption &&
                              element.channels.map((element, index) => (
                                <option key={index} value={element._id}>
                                  {element.name}
                                </option>
                              ))
                          )}
                        </select>
                        <input type="text" id="editChannel-input" name="name" />
                        <button type="submit">DÜZENLE</button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )}
            </div>
          </div>
        </Modal>
      )}
      {!(!selectedRTC.isConnected && selectedRTC.id) && activeRTC.id && (
        <RtcModal>
          <div id="RTC-panel-content-main">
            <div id="RTC-panel-content-main-info">
              <span>{activeRTC.name}</span>
            </div>
            <div id="RTC-panel-content-main-buttons">
              <div id="RTC-panel-content-main-buttons-up">
                <div
                  id="RTC-panel-content-main-buttons-up-screen"
                  onClick={() => {
                    setRtcScreen(true);
                    setSelectedChannel({ id: "", name: "" });
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M3 3.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m1.5 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
                    <path d="M.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5zM1 5V2h14v3zm0 1h14v8H1z" />
                  </svg>
                </div>
                <div
                  id="RTC-panel-content-main-buttons-up-cam"
                  onClick={async () => {
                    if (
                      !rtcMediaSettings.cam.open &&
                      !rtcMediaSettings.cam.status
                    ) {
                      const streamList = await getStreams(rtcMediaSettings, [
                        "cam",
                      ]);
                      setRtcMediaSettings((prev) => ({
                        ...prev,
                        cam: {
                          ...prev.cam,
                          open: true,
                        },
                      }));
                      setStreams((prev) => ({ ...prev, ...streamList }));
                    } else {
                      setRtcMediaSettings((prev) => ({
                        ...prev,
                        cam: {
                          ...prev.cam,
                          open: false,
                        },
                      }));
                    }
                  }}
                >
                  {rtcMediaSettings.cam.status ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.961 12.365a2 2 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272zm-10.114-9A2 2 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728zm9.746 11.925-10-14 .814-.58 10 14z"
                      />
                    </svg>
                  )}
                </div>
                <div
                  id="RTC-panel-content-main-buttons-up-screen_share"
                  onClick={async () => {
                    if (
                      !rtcMediaSettings.screen.open &&
                      !rtcMediaSettings.screen.status
                    ) {
                      const streamList = await getStreams(rtcMediaSettings, [
                        "screen",
                      ]);
                      setRtcMediaSettings((prev) => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          open: true,
                        },
                      }));
                      setStreams((prev) => ({ ...prev, ...streamList }));
                    } else {
                      setRtcMediaSettings((prev) => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          open: false,
                        },
                      }));
                    }
                  }}
                >
                  {rtcMediaSettings.screen.status ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M6 12q0 1-.25 1.5H5a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-.75Q10 13 10 12h4c2 0 2-2 2-2V4c0-2-2-2-2-2H2C0 2 0 4 0 4v6c0 2 2 2 2 2z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4q0 1 .25 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.75Q6 13 6 12H2s-2 0-2-2zm1.398-.855a.76.76 0 0 0-.254.302A1.5 1.5 0 0 0 1 4.01V10c0 .325.078.502.145.602q.105.156.302.254a1.5 1.5 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.76.76 0 0 0 .254-.302 1.5 1.5 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.76.76 0 0 0-.302-.254A1.5 1.5 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145" />
                    </svg>
                  )}
                </div>
              </div>
              <div id="RTC-panel-content-main-buttons-down">
                <div
                  id="RTC-panel-content-main-buttons-down-mic"
                  onClick={async () => {
                    if (
                      !rtcMediaSettings.mic.open &&
                      !rtcMediaSettings.mic.status
                    ) {
                      const streamList = await getStreams(rtcMediaSettings, [
                        "audio",
                      ]);
                      setRtcMediaSettings((prev) => ({
                        ...prev,
                        mic: {
                          ...prev.mic,
                          open: true,
                        },
                      }));
                      setStreams((prev) => ({ ...prev, ...streamList }));
                    } else {
                      setRtcMediaSettings((prev) => ({
                        ...prev,
                        mic: {
                          ...prev.mic,
                          open: false,
                        },
                      }));
                    }
                  }}
                >
                  {rtcMediaSettings.mic.status ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z" />
                      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3" />
                      <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z" />
                    </svg>
                  )}
                </div>
                <div id="RTC-panel-content-main-buttons-down-listen">
                  {rtcMediaSettings.listen.status ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="1em"
                      viewBox="0 -960 960 960"
                      width="1em"
                      fill="currentColor"
                    >
                      <path d="M480-40v-80h280v-40H600v-320h160v-40q0-116-82-198t-198-82q-116 0-198 82t-82 198v40h160v320H200q-33 0-56.5-23.5T120-240v-280q0-74 28.5-139.5T226-774q49-49 114.5-77.5T480-880q74 0 139.5 28.5T734-774q49 49 77.5 114.5T840-520v400q0 33-23.5 56.5T760-40H480ZM200-240h80v-160h-80v160Zm480 0h80v-160h-80v160ZM200-400h80-80Zm480 0h80-80Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="1em"
                      viewBox="0 -960 960 960"
                      width="1em"
                      fill="currentColor"
                    >
                      <path d="m840-234-80-80v-86h-86l-80-80h166v-40q0-118-82-199t-198-81q-44 0-83.5 12.5T324-752l-58-56q45-35 99.5-53.5T480-880q74 0 139.5 28T734-775q49 49 77.5 114.5T840-520v286ZM480-40v-80h247l-40-40h-87v-87L221-626q-9 24-15 51.5t-6 54.5v40h160v320H200q-33 0-56.5-23.5T120-240v-280q0-45 10.5-87t30.5-80L27-820l57-56L875-84v44H480ZM200-240h80v-160h-80v160Zm0-160h80-80Zm474 0h86-86Z" />
                    </svg>
                  )}
                </div>
                <div
                  id="RTC-panel-content-main-buttons-down-exit"
                  onClick={() => {
                    setSelectedRTC((prev) => ({
                      ...prev,
                      isConnected: false,
                    }));
                    disconnect(socket);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877zm9.261 1.135a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708"
                    />
                  </svg>
                </div>
                <div
                  id="RTC-panel-content-main-buttons-down-settings"
                  onClick={() => {
                    setSettingsPanelIsOpen(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div id="hubRtcAudioDiv">
            {consumingStreams.audio?.map((element, i) => (
              <audio
                autoPlay
                key={i}
                ref={(audio) => {
                  if (audio) audio.srcObject = element.stream;
                }}
              ></audio>
            ))}
          </div>
        </RtcModal>
      )}
      {!selectedRTC.isConnected && selectedRTC.id && (
        <RtcModal>
          <div id="RTC-panel-connecting-screen">
            <div id="RTC-panel-connecting-screen-info">
              <span>{selectedRTC.name} kanalına bağlanmak istiyor musun?</span>
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
        </RtcModal>
      )}
    </>
  );
}
