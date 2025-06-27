import { useEffect, useState } from "react";
import "./ProfileScreen.css";
import useFetch from "../../../../hooks/useFetch";

export default function ProfileScreen({ profileId }) {
  const [profileInfos, setProfileInfos] = useState();

  const [profileRequest, profileRequestData] = useFetch();
  useEffect(() => {
    if (profileId) {
      profileRequest({
        url: "api/get-profile",
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: profileId,
      });
    }
  }, [profileId]);

  useEffect(() => {
    if (profileRequestData) {
      if (profileRequestData.status) setProfileInfos(profileRequestData.data);
      else {
        setProfileInfos(false);
      }
      console.log(profileRequestData.msg);
    }
  }, [profileRequestData]);

  return (
    <>
      <div id="profileScreen-container">
        <div id="profileScreen">
          <div id="profileScreen-header">
            <div
              id="profileScreen-header-banner"
              style={{
                backgroundImage: `url("${
                  profileInfos && profileInfos.bannerURL != ""
                    ? profileInfos.bannerURL
                    : "img/no-profile-banner.png"
                }")`,
              }}
            ></div>
            <div id="profileScreen-header-info">
              <div id="profileScreen-header-info-row1">
                <div id="profileScreen-header-info-row1-profilePhoto">
                  <img
                    src={
                      profileInfos && profileInfos.user.profilePhotoURL != ""
                        ? profileInfos.user.profilePhotoURL
                        : "img/no-profile-photo.png"
                    }
                  />
                </div>
                <div id="profileScreen-header-info-row1-nick">
                  <span>{profileInfos && profileInfos.user.nick}</span>
                </div>
              </div>
              <div id="profileScreen-header-info-row2">
                <div id="profileScreen-header-info-row2-bio">
                  <span>{profileInfos && profileInfos.bio}</span>
                </div>
              </div>
            </div>
          </div>
          <div id="profileScreen-body"></div>
        </div>
      </div>
    </>
  );
}
