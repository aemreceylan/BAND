import { useContext, useEffect } from "react";
import "./UsersElement.css";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";

export default function UsersElement({ data }) {
  const { setContextMenu } = useContext(WSContext);
  const [userSettingsRequest, userSettingsData] = useFetch();

useEffect(()=>{
  if(userSettingsData){
    console.log(userSettingsData.msg)
  }
}
  ,[userSettingsData])

  function setUserSettings(type, req_data) {
    userSettingsRequest({
      url: "api/set-user-settings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: type, data: req_data }),
    });
  }
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
                text: "Kullanıcıyı Yasakla",
                function: () => {
                  setUserSettings("ban-client", data._id);
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
