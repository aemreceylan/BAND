import Chat from "./Components/Chat/Chat";
import Hub from "./Components/Hub/Hub";
import HubList from "./Components/HubList/HubList";
import Users from "./Components/Users/Users";
import "./roots.css";
import "./fonts.css";
import "./App.css";
import { useEffect } from "react";
import WSProvider from "./Contexts/WSProvider";
import io from "socket.io-client";
const socket = io("http://localhost:3000");

export default function App() {
  useEffect(() => {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);

  return (
    <>
      <WSProvider>
        <div id="app">
          <div id="app-main">
            <HubList />
            <Hub />
            <Chat />
            <Users />
          </div>
        </div>
      </WSProvider>
    </>
  );
}
