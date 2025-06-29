import { useContext, useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import Panel from "../Panel/Panel";
import HubListElement from "./HubElement/HubListElement";
import "./HubList.css";
import { WSContext } from "../../Contexts/WSProvider";

export default function HubList() {
  const {
    setLogout,
    logOutRequest,
    setContextMenu,
    setProfileScreen,
    profileId,
    setSelectedChannel,
    profilePhotoURL,
    nick,
  } = useContext(WSContext);
  return (
    <>
      <div id="hubList">
        <Panel>
          <div id="hubList-panel">
            <div
              id="hubList-profile-button"
              onClick={() => {
                setProfileScreen(profileId);
                setSelectedChannel({ id: "", name: "" });
              }}
              onContextMenu={(e) => {
                setContextMenu({
                  isVisible: true,
                  coords: { x: e.pageX, y: e.pageY },
                  items: [
                    {
                      text: "Profile Git",
                      function: () => {
                        setProfileScreen(profileId);
                        setSelectedChannel({ id: "", name: "" });
                      },
                    },
                    {
                      text: "Çıkış Yap",
                      function: () => {
                        logOutRequest({
                          url: "api/log-out",
                        });
                      },
                    },
                  ],
                });
              }}
            >
              <img
                title={nick ? nick : "Profil"}
                src={
                  profilePhotoURL ? profilePhotoURL : "img/no-profile-photo.png"
                }
              />
            </div>
          </div>
        </Panel>
        <div id="hubList-list">
          {/* <HubListElement />
          <HubListElement />
          <HubListElement /> */}
        </div>
      </div>
    </>
  );
}
