import Panel from "../Panel/Panel";
import HubListElement from "./HubElement/HubListElement";
import "./HubList.css";
import noProfilePhoto from "../../assets/img/no-profile-photo.png";

export default function HubList() {
  return (
    <>
      <div id="hubList">
        <Panel>
          <div id="hubList-panel">
            <div id="hubList-profile-button">
              <img src={noProfilePhoto} />
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
