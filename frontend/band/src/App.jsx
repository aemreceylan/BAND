import Chat from "./Components/Chat/Chat";
import Hub from "./Components/Hub/Hub";
import HubList from "./Components/HubList/HubList";
import Users from "./Components/Users/Users";
import "./roots.css";
import "./fonts.css";
import "./App.css";
import { useEffect } from "react";

export default function App() {
  // useEffect(() => {
  //   document.addEventListener("contextmenu", (e) => e.preventDefault());
  // }, []);

  return (
    <>
      <div id="app">
        <div id="app-main">
          <HubList />
          <Hub />
          <Chat />
          <Users />
        </div>
      </div>
    </>
  );
}
