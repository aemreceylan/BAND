import Message from "./Message/Message";

import "./Post.css";

export default function Post() {
  return (
    <>
      <div className="post">
        <div className="post-account">
          <img src="img/no-profile-photo.png" />
        </div>
        <div className="post-content">
          <div className="post-nick">{"Nick"}</div>
          <div className="post-message-list">
            <Message />
            <Message />
            <Message />
            <Message />
          </div>
        </div>
      </div>
    </>
  );
}
