import { useContext, useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import Panel from "../Panel/Panel";
import HubListElement from "./HubElement/HubListElement";
import "./HubList.css";
import { WSContext } from "../../Contexts/WSProvider";

export default function HubList() {
  const { setLogin } = useContext(WSContext);
  const [logOutRequest, logOutRequestData] = useFetch();
  useEffect(() => {
    if (logOutRequestData) {
      if (logOutRequestData.status) {
        setLogin(false);
      }
      console.log(logOutRequestData.msg);
    }
  }, [logOutRequestData]);
  return (
    <>
      <div id="hubList">
        <Panel>
          <div id="hubList-panel">
            <div
              id="hubList-profile-button"
              onClick={() => {
                logOutRequest({
                  url: "log-out",
                });
              }}
            >
              <img src="img/no-profile-photo.png" />
            </div>
          </div>
        </Panel>
        <div id="hubList-list">
          <HubListElement />
          <HubListElement />
          <HubListElement />
        </div>
      </div>
    </>
  );
}
