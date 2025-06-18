import { createContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import useFetch from "../hooks/useFetch";
import useCall from "../hooks/useCall";

export const WSContext = createContext();

export const _csrfToken = [];

export default function WSProvider({ children }) {
  const [login, setLogin] = useState(false);
  const [userList, setUserList] = useState();
  const [sectionList, setSectionList] = useState();
  const [socket, setSocket] = useState();
  const [authToken, setAuthToken] = useState();
  const [selectedChannel, setSelectedChannel] = useState({ id: "", name: "" });
  const [csrfToken, setCsrfToken] = useState();
  const [logout, setLogout] = useState(false);
  const [selectedRTC, setSelectedRTC] = useState({
    id: "",
    name: "",
  });
  const [activeRTC, setActiveRTC] = useState({
    id: "",
    name: "",
  });
  const [rtcMediaSettings, setRtcMediaSettings] = useState({
    mic: { open: false, status: false },
    cam: { open: false, status: false },
    screen: { open: false, status: false },
    listen: { open: true, status: true },
  });
  const [streams, setStreams] = useState({});
  const [consumingStreams, setConsumingStreams] = useState({
    audio: [],
    cam: [],
    screen: [],
  });
  const [rtcScreen, setRtcScreen] = useState(false);
  const [inviteToken, setInviteToken] = useState();
  const [contextMenu, setContextMenu] = useState({});

  const [csrfRequest, csrfRequestData] = useFetch();
  const [isAuthRequest, isAuthData] = useFetch();
  const [
    callInit,
    getStreams,
    setProducerTransport,
    publish,
    setConsumerTransport,
    consume,
    disconnect,
    isDisconnect,
    waitNewProducers,
    closeProduce,
  ] = useCall(setConsumingStreams, setRtcMediaSettings);

  const [logOutRequest, logOutRequestData] = useFetch();
  useEffect(() => {
    if (logOutRequestData) {
      if (logOutRequestData.status) {
        setLogout(true);
      }
      console.log(logOutRequestData.msg);
    }
  }, [logOutRequestData]);

  useEffect(() => {
    isAuthRequest({ url: "api/session-check" });
    if (localStorage.getItem("selectedChannel"))
      setSelectedChannel(JSON.parse(localStorage.getItem("selectedChannel")));
    csrfRequest({
      url: "api/get-csrf",
    });
  }, []);

  useEffect(() => {
    if (selectedRTC.isConnected == true) {
      socket.emit("leaveChannel", activeRTC.id, (data) => {
        console.log(data.msg);
      });
      socket.emit("joinChannel", selectedRTC.id, async (data) => {
        console.log(data);
      });
      setActiveRTC({ id: selectedRTC.id, name: selectedRTC.name });
    } else if (selectedRTC.isConnected == false) {
      socket.emit("leaveChannel", activeRTC.id, (data) => {
        console.log(data.msg);
        if (data.status) {
          setSelectedRTC({
            id: "",
            name: "",
          });
          setActiveRTC({
            id: "",
            name: "",
          });
        }
      });
    }
  }, [selectedRTC.isConnected]);

  useEffect(() => {
    if (activeRTC.id) {
      (async () => {
        try {
          if (!isDisconnect()) {
            console.log("Switching room");
            await disconnect(socket);
            setStreams({});
            setRtcMediaSettings((prev) => ({
              ...prev,
              mic: { id: prev.mic.id, open: false, status: false },
            }));
            setRtcMediaSettings((prev) => ({
              ...prev,
              cam: { id: prev.cam.id, open: false, status: false },
            }));
            setRtcMediaSettings((prev) => ({
              ...prev,
              screen: { id: null, open: false, status: false },
            }));
            setConsumingStreams({
              audio: [],
              cam: [],
              screen: [],
            });
          }
          await callInit(socket);
          await setProducerTransport(socket);
          await setConsumerTransport(socket);
          (async () => {
            await consume(socket);
            waitNewProducers(socket);
          })();
        } catch (err) {
          console.log(err);
        }
      })();
    } else {
      Object.values(streams).forEach((element) => {
        element.getTracks().forEach((element) => {
          element.stop();
        });
      });
      setStreams({});
    }
  }, [activeRTC]);

  useEffect(() => {
    if (csrfRequestData) {
      if (csrfRequestData.status) {
        setCsrfToken(csrfRequestData.csrfToken);
        _csrfToken[0] = csrfRequestData.csrfToken;
      }
      console.log(csrfRequestData.msg);
    }
  }, [csrfRequestData]);

  useEffect(() => {
    if (isAuthData) {
      console.log(isAuthData.message);
      if (isAuthData.status) {
        setLogin(true);
        setAuthToken(isAuthData.authToken);
        setSocket(
          io("localhost:3000", {
            auth: { authToken: isAuthData.authToken },
          })
        );
      }
    }
  }, [isAuthData]);

  useEffect(() => {
    if (socket) {
      socket.on("welcome", (message) => {
        console.log(message);
      });
      socket.on("userList", (data) => {
        setUserList(new Map(data));
      });
      socket.on("sectionList", (data) => {
        setSectionList(JSON.parse(data));
      });
    }
  }, [socket]);

  useEffect(() => {
    if (login && inviteToken) {
      console.log("djosjodsj");
      logOutRequest({
        url: "api/log-out",
      });
    }
  }, [login, inviteToken]);

  useEffect(() => {
    if (logout) {
      setLogin(false);
      csrfRequest({
        url: "api/get-csrf",
      });
      socket.disconnect();
      setLogout(false);
    }
  }, [logout]);

  const contextValue = {
    login,
    setLogin,
    setSocket,
    io,
    userList,
    setAuthToken,
    authToken,
    sectionList,
    selectedChannel,
    setSelectedChannel,
    socket,
    setLogout,
    logout,
    selectedRTC,
    setSelectedRTC,
    activeRTC,
    setActiveRTC,
    rtcMediaSettings,
    setStreams,
    streams,
    setRtcMediaSettings,
    publish,
    disconnect,
    isDisconnect,
    consumingStreams,
    setConsumingStreams,
    getStreams,
    rtcScreen,
    setRtcScreen,
    closeProduce,
    setInviteToken,
    inviteToken,
    logOutRequest,
    contextMenu,
    setContextMenu,
  };

  return (
    <>
      <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>
    </>
  );
}
