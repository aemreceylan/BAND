import Post from "./Post/Post";
import "./Feed.css";
import { useContext, useEffect, useRef, useState } from "react";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";

export default function Feed() {
  const feedRef = useRef();
  const { selectedChannel, socket } = useContext(WSContext);
  const [feedContentRequest, feedContentRequestData] = useFetch();
  const [content, setContent] = useState();

  useEffect(() => {
    if (selectedChannel.id) {
      feedContentRequest({
        url: "get-messages",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannel.id,
          messageAmount: 25,
          skip: 0,
        }),
      });
      socket.emit("joinChannel", selectedChannel.id, (data) => {
        console.log(data);
      });
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (feedContentRequestData) {
      if (feedContentRequestData.status) {
        console.log(feedContentRequestData.msg);
        setContent(feedContentRequestData.data);
      } else {
        console.log(feedContentRequestData.msg);
      }
    }
  }, [feedContentRequestData]);

  useEffect(() => {
    socket.on("newMessageFromServer", (data) => {
      console.log(JSON.parse(data));
    });
  }, []);

  setTimeout(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, 0);

  return (
    <>
      <div id="feed" ref={feedRef}>
        {content?.map((element, index) => (
          <Post key={index} data={element} />
        ))}
      </div>
    </>
  );
}
