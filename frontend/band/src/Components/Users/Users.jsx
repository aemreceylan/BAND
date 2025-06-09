import { useContext, useEffect, useState } from "react";
import Panel from "../Panel/Panel";
import "./Users.css";
import UsersElement from "./UsersElement/UsersElement";
import { WSContext } from "../../Contexts/WSProvider";

export default function Users() {
  const [isOpen, setIsOpen] = useState(true);
  const { userList } = useContext(WSContext);
  const [onlineList, setOnlineList] = useState([]);
  const [offlineList, setOfflineList] = useState([]);

  useEffect(() => {
    if (userList) {
      setOnlineList([]);
      setOfflineList([]);
      Array.from(userList.values())?.forEach((element) => {
        if (element.isOnline) setOnlineList((prev) => [...prev, element]);
        else setOfflineList((prev) => [...prev, element]);
      });
    }
  }, [userList]);

  return (
    <>
      <div id="users" className={!isOpen ? "users-closed" : ""}>
        <Panel>
          <div id="users-panel">
            <div id="users-buttons">
              <div
                id="users-buttons-frame"
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
                      d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8m-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5"
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
                      d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5M10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5"
                    />
                  </svg>
                )}
              </div>
            </div>
            <div id="users-search">
              <input type="text" placeholder="Kullanıcı ara..." />
            </div>
          </div>
        </Panel>
        <div id="users-list">
          <div className="users-list-category">
            <div className="users-list-category-title">
              <span>Çevrimiçi - {onlineList.length}</span>
            </div>
            <div className="user-list-category-list">
              {onlineList?.map((element, index) => {
                if (element.isOnline)
                  return <UsersElement key={index} data={element} />;
              })}
            </div>
          </div>
          <div className="users-list-category">
            <div className="users-list-category-title">
              <span>Çevrimdışı - {offlineList.length}</span>
            </div>
            <div className="user-list-category-list">
              {offlineList?.map((element, index) => {
                if (!element.isOnline)
                  return <UsersElement key={index} data={element} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
