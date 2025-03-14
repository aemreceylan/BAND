import Message from "./Message/Message";

import "./Post.css";

export default function Post({data}) {
  return (
    <>
      <div className="post">
        <div className="post-account">
          <img src="img/no-profile-photo.png" />
        </div>
        <div className="post-content">
          <div className="post-nick">{data.sender.nick}</div>
          <div className="post-message-list">
            <Message data={data}/>
          </div>
        </div>
      </div>
    </>
  );
}
