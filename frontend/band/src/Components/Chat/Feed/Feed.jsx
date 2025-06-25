import Post from "./Post/Post";
import "./Feed.css";
import { useContext, useEffect, useRef, useState } from "react";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";
import RtcScreen from "./RtcScreen/RtcScreen";
import ProfileScreen from "./ProfileScreen/ProfileScreen";

export default function Feed() {
  const feedRef = useRef();
  const messageAmountRef = useRef(25);
  const scrollData = useRef();
  const { selectedChannel, socket, rtcScreen, setRtcScreen, profileScreen } =
    useContext(WSContext);
  const [feedContentRequest, feedContentRequestData, feedContentLoading] =
    useFetch();
  const [messages, setMessages] = useState({});
  const [isMessagesEnd, setIsMessagesEnd] = useState({});
  const [scrollTopData, setScrollTopData] = useState({});
  const [inChatBottom, setInChatBottom] = useState();

  useEffect(() => {
    if (inChatBottom) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    } else if (scrollData.current) {
      feedRef.current.scrollTop =
        feedRef.current.scrollHeight - scrollData.current;
      scrollData.current = null;
    }
  }, [messages]);

  useEffect(() => {
    if (scrollTopData[selectedChannel.id]) {
      if (
        feedRef.current.scrollHeight - scrollTopData[selectedChannel.id] <=
        feedRef.current.offsetHeight +
          parseInt(window.getComputedStyle(feedRef.current).fontSize)
      ) {
        setInChatBottom(true);
      } else {
        setInChatBottom(false);
      }
    }
  }, [scrollTopData]);

  useEffect(() => {
    if (selectedChannel.id) {
      setRtcScreen(false);
      if (!messages[selectedChannel.id]) {
        setMessages((prev) => ({
          ...prev,
          [selectedChannel.id]: [],
        }));
        feedContentRequest({
          url: "api/get-messages",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: selectedChannel.id,
            messageAmount: messageAmountRef.current,
            skip: 0,
          }),
        });
      }
      feedRef.current.scrollTop = scrollTopData[selectedChannel.id];
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
          scrollData.current = feedRef.current.scrollHeight;
          setMessages((prev) => ({
            ...prev,
            [feedContentRequestData.data[0].channel._id]: [
              ...feedContentRequestData.data,
              ...prev[feedContentRequestData.data[0].channel._id],
            ],
          }));
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
              url: "api/get-messages",
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
          setScrollTopData((prev) => ({
            ...prev,
            [selectedChannel.id]: e.target.scrollTop,
          }));
        }}
      >
        {!rtcScreen && feedContentLoading && <span className="loader"></span>}
        {profileScreen ? (
          <ProfileScreen profileId={profileScreen} />
        ) : rtcScreen ? (
          <RtcScreen />
        ) : (
          messages[selectedChannel.id]?.map((element, index) => (
            <Post key={index} data={element} />
          ))
        )}
      </div>
    </>
  );
}
