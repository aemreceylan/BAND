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
      if (!messages[selectedChannel.id]) {
        setMessages((prev) => ({
          ...prev,
          [selectedChannel.id]: [],
        }));
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
      }
      socket.emit("joinChannel", selectedChannel.id, (data) => {
        console.log(data);
      });
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (feedContentRequestData) {
      if (feedContentRequestData.status) {
        setMessages((prev) => ({
          ...prev,
          [feedContentRequestData.data[0].channel._id]: [
            ...prev[feedContentRequestData.data[0].channel._id],
            ...feedContentRequestData.data,
          ],
        }));
      } else {
        console.log(feedContentRequestData.msg);
      }
    }
  }, [feedContentRequestData]);

  useEffect(() => {
    socket.on("newMessageFromServer", (data) => {
      data = JSON.parse(data);
      console.log(data);
      setMessages((prev) => ({
        ...prev,
        [data.channel._id]: [...prev[data.channel._id], data],
      }));
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
          if (
            e.target.scrollTop == 0 &&
            messages[selectedChannel.id].length >= messageAmount
          ) {
            console.log("sa");
          }
        }}
      >
        {feedContentLoading && <span className="loader"></span>}
        {messages[selectedChannel.id]?.map((element, index) => (
          <Post key={index} data={element} />
        ))}
      </div>
    </>
  );
}
