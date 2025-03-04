import Category from "./Category/Category";
import Panel from "../Panel/Panel";
import "./Hub.css";
import { useContext, useEffect, useState } from "react";
import Modal from "../UI/Modal/Modal";
import { WSContext } from "../../Contexts/WSProvider";
import userValidation from "../../hooks/userValidation";

export default function Hub() {
  const [isOpen, setIsOpen] = useState(true);
  const [settingsPanelIsOpen, setSettingsPanelIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const { userId } = useContext(WSContext);
  const [isApproved, setIsApproved] = useState();

  useEffect(() => {
    (async () => {
      if (selectedOption == 1) {
        setIsApproved(await userValidation(userId));
      }
    })();
  }, [selectedOption]);

  return (
    <>
      <div id="hub" className={!isOpen ? "hub-closed" : ""}>
        <Panel>
          <div id="hub-panel">
            <div id="hub-panel-title">{"HUB"}</div>
            <div id="hub-panel-buttons">
              <div
                id="hub-panel-buttons-settings"
                onClick={() => {
                  setSettingsPanelIsOpen(true);
                }}
                title="Sunucu Ayarları"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                </svg>
              </div>
              <div
                id="hub-panel-buttons-frame"
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
                      d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5M10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5"
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
                      d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8m-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </Panel>
        <div id="hub-categories">
          <Category />
          <Category />
          <Category />
          <Category />
        </div>
      </div>
      {settingsPanelIsOpen && (
        <Modal
          backdropStyle={{
            backgroundColor: "var(--dark-background-dark-gray)",
          }}
        >
          <div id="hubSettings-container">
            <div id="hubSettings-container-option-buttons">
              <div
                id="hubSettings-container-closeButton"
                onClick={() => setSettingsPanelIsOpen(false)}
              >
                X
              </div>
              <div
                className={`hubSettings-container-option-button ${
                  selectedOption == 0
                    ? "hubSettings-container-option-button-selected"
                    : ""
                }`}
                id="hubSettings-container-option-buttons-personal"
                onClick={() => setSelectedOption(0)}
              >
                <span>Kişisel Ayarlar</span>
              </div>
              <div
                className={`hubSettings-container-option-button ${
                  selectedOption == 1
                    ? "hubSettings-container-option-button-selected"
                    : ""
                }`}
                id="hubSettings-container-option-buttons-hub"
                onClick={() => setSelectedOption(1)}
              >
                <span>Hub Ayarları</span>
              </div>
            </div>
            <div id="hubSettings-container-content">
              {selectedOption == 0 && "Kişisel ayarlar"}
              {selectedOption == 1 && isApproved && (
                <>
                  <div id="hubSettings">
                    <div id="addChannel">
                      <label htmlFor="add-channel" onClick={() => {}}>
                        Kanal Ekle
                      </label>
                      <input type="text" id="add-channel" />
                      <button type="button">EKLE</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
