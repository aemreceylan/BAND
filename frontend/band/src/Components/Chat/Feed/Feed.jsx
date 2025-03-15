import Post from "./Post/Post";
import "./Feed.css";
import { useContext, useEffect, useRef, useState } from "react";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";

const messageAmount = 25;

export default function Feed() {
  const feedRef = useRef();
  const { selectedChannel, socket } = useContext(WSContext);
  const [feedContentRequest, feedContentRequestData, feedContentLoading] =
    useFetch();
  const [messages, setMessages] = useState({});
  console.log(messages);
  useEffect(() => {
    if (selectedChannel.id) {
      feedContentRequest({
        url: "get-messages",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannel.id,
          messageAmount: messageAmount,
          skip: 0,
        }),
      });
      socket.emit("joinChannel", selectedChannel.id, (data) => {
        console.log(data);
      });
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (feedContentRequestData && !feedContentLoading) {
      if (feedContentRequestData.status) {
        console.log(feedContentRequestData.msg);
        // setContent(feedContentRequestData.data);
        setContent((prev) => [...feedContentRequestData.data, ...prev]);
      } else {
        console.log(feedContentRequestData.msg);
      }
    }
  }, [feedContentRequestData]);

  useEffect(() => {
    socket.on("newMessageFromServer", (data) => {
      data = JSON.parse(data);
      setContent((prev) => [...prev, data]);
    });
  }, []);

  setTimeout(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, 0);

  return (
    <>
      <div
        id="feed"
        ref={feedRef}
        onScroll={(e) => {
          if (e.target.scrollTop == 0 && content.length >= messageAmount) {
            console.log("sa");
          }
        }}
      >
        {feedContentLoading && <span className="loader"></span>}
        {content?.map((element, index) => (
          <Post key={index} data={element} />
        ))}
      </div>
    </>
  );
}
