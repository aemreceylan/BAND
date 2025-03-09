import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const WSContext = createContext();

export default function WSProvider({ children }) {
  const [login, setLogin] = useState(false);
  const [userList, setUserList] = useState();
  const [sectionList, setSectionList] = useState();
  const [socket, setSocket] = useState();
  const [userId, setUserId] = useState();

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

  const contextValue = {
    login,
    setLogin,
    setSocket,
    io,
    userList,
    setUserId,
    userId,
    sectionList,
  };

  return (
    <>
      <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>
    </>
  );
}
