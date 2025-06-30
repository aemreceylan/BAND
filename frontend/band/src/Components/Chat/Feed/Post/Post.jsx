import { useRef } from "react";
import Message from "./Message/Message";

import "./Post.css";
import { useContext } from "react";
import { WSContext } from "../../../../Contexts/WSProvider";

export default function Post({ data }) {
  const { userList } = useContext(WSContext);

  return (
    <>
      <div className="post">
        <div className="post-account">
          <img
            src={userList.get(data.sender._id).profilePhotoURL || "img/no-profile-photo.png"}
          />
        </div>
        <div className="post-content">
          <div className="post-info">
            <span className="post-info-nick">{data.sender.nick}</span>
            <span className="post-info-timestamp">
              {`${new Date(data.timestamp).getHours()} : ${new Date(
                data.timestamp
              ).getMinutes()}`}
            </span>
          </div>
          <div className="post-message-list">
            <Message data={data} />
          </div>
        </div>
      </div>
    </>
  );
}
