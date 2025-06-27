import { useContext, useEffect } from "react";
import "./UsersElement.css";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";

export default function UsersElement({ data }) {
  const {
    setContextMenu,
    setProfileScreen,
    setSelectedChannel,
    setHubSettings,
  } = useContext(WSContext);

  return (
    <>
      <div
        className="usersElement"
        onContextMenu={(e) => {
          setContextMenu({
            isVisible: true,
            coords: { x: e.pageX, y: e.pageY },
            items: [
              {
                text: "Profile Git",
                function: () => {
                  setProfileScreen(data.profile);
                  setSelectedChannel({ id: "", name: "" });
                },
              },
              {
                text: "Kullanıcıyı Yasakla",
                function: () => {
                  setHubSettings("ban-client", data._id);
                },
              },
            ],
          });
        }}
      >
        <div className="usersElement-img">
          <img
            src={
              data.profilePhotoURL != ""
                ? data.profilePhotoURL
                : "img/no-profile-photo.png"
            }
          />
        </div>
        <div className="usersElement-content">
          <div className="usersElement-nick">
            <span>{data.nick}</span>
          </div>
        </div>
      </div>
    </>
  );
}
