import Post from "./Post/Post";
import "./Feed.css";
import { useContext, useEffect, useRef, useState } from "react";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";

export default function Feed() {
  const feedRef = useRef();
  const messageAmountRef = useRef(25);
  const scrollData = useRef({});
  const { selectedChannel, socket, activeRTC } = useContext(WSContext);
  const [feedContentRequest, feedContentRequestData, feedContentLoading] =
    useFetch();
  const [messages, setMessages] = useState({});
  const [isMessagesEnd, setIsMessagesEnd] = useState({});

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
            messageAmount: messageAmountRef.current,
            skip: 0,
          }),
        });
      }
      socket.emit("joinChannel", selectedChannel.id, (data) => {
        console.log(data);
      });
      localStorage.setItem("selectedChannel", JSON.stringify(selectedChannel));
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (feedContentRequestData) {
      if (feedContentRequestData.status) {
        if (feedContentRequestData.isMessagesEnd) {
          setIsMessagesEnd((prev) => ({ ...prev, [selectedChannel.id]: true }));
        }
        if (feedContentRequestData.data.length > 0) {
          scrollData.current[selectedChannel.id] = feedRef.current.scrollHeight;
          setMessages((prev) => ({
            ...prev,
            [feedContentRequestData.data[0].channel._id]: [
              ...feedContentRequestData.data,
              ...prev[feedContentRequestData.data[0].channel._id],
            ],
          }));
          setTimeout(() => {
            feedRef.current.scrollTop =
              feedRef.current.scrollHeight -
              scrollData.current[selectedChannel.id];
          }, 0);
        }
      } else {
        console.log(feedContentRequestData.msg);
      }
    }
  }, [feedContentRequestData]);

  useEffect(() => {
    if (socket) {
      socket.on("newMessageFromServer", (data) => {
        data = JSON.parse(data);
        setMessages((prev) => ({
          ...prev,
          [data.channel._id]: [...prev[data.channel._id], data],
        }));
      });
    }
  }, [socket]);

  return (
    <>
      <div
        id="feed"
        ref={feedRef}
        onScroll={(e) => {
          if (
            messages[selectedChannel.id] &&
            e.target.scrollTop == 0 &&
            messages[selectedChannel.id].length >= messageAmountRef.current &&
            !isMessagesEnd[selectedChannel.id]
          ) {
            feedContentRequest({
              url: "get-messages",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channelId: selectedChannel.id,
                messageAmount: messageAmountRef.current,
                skip: 0,
                firstMessage: {
                  timestamp: messages[selectedChannel.id][0].timestamp,
                },
              }),
            });
          }
        }}
      >
        {!activeRTC.screen && feedContentLoading && <span className="loader"></span>}
        {activeRTC.screen
          ? ("")
          : messages[selectedChannel.id]?.map((element, index) => (
              <Post key={index} data={element} />
            ))}
      </div>
    </>
  );
}
