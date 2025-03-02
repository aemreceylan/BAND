import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const WSContext = createContext();

export default function WSProvider({ children }) {
  const [login, setLogin] = useState(false);
  const [userList, setUserList] = useState();
  const [socket, setSocket] = useState();

  useEffect(() => {
    if (socket) {
      socket.on("userList", (data) => {
        setUserList(data);
      });
    }
  }, [socket]);

  const contextValue = { login, setLogin, setSocket, io, userList };

  return (
    <>
      <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>
    </>
  );
}
