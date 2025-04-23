import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useFetch from "../hooks/useFetch";

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
  const [csrfRequest, csrfRequestData] = useFetch();
  const [isAuthRequest, isAuthData] = useFetch();

  useEffect(() => {
    isAuthRequest({ url: "session-check" });
    if (localStorage.getItem("selectedChannel"))
      setSelectedChannel(JSON.parse(localStorage.getItem("selectedChannel")));
    csrfRequest({
      url: "get-csrf",
    });
  }, []);

  useEffect(() => {
    if (selectedRTC.id) {
      if (selectedRTC.isConnected == true) {
        socket.emit("leaveChannel", activeRTC.id, (data) => {
          console.log(data.msg);
        });
        socket.emit("joinChannel", selectedRTC.id, (data) => {
          console.log(data);
        });
        setActiveRTC({ id: selectedRTC.id, name: selectedRTC.name });
      } else if (selectedRTC.isConnected == false && selectedRTC.id) {
        socket.emit("leaveChannel", selectedRTC.id, (data) => {
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
    }
  }, [selectedRTC.isConnected]);

  useEffect(() => {
    if (csrfRequestData) {
      if (csrfRequestData.status) {
        setCsrfToken(csrfRequestData.csrfToken);
        _csrfToken[0] = csrfRequestData.csrfToken;
      }
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
        setUserList(data);
      });
      socket.on("sectionList", (data) => {
        setSectionList(JSON.parse(data));
      });
    }
  }, [socket]);

  useEffect(() => {
    if (logout) {
      setLogin(false);
      csrfRequest({
        url: "get-csrf",
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
  };

  return (
    <>
      <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>
    </>
  );
}
