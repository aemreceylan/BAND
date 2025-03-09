import Post from "./Post/Post";
import "./Feed.css";
import { useContext, useEffect, useRef, useState } from "react";
import { WSContext } from "../../../Contexts/WSProvider";
import useFetch from "../../../hooks/useFetch";

export default function Feed() {
  const feedRef = useRef();
  const { selectedChannel } = useContext(WSContext);
  const [feedContentRequest, feedContentRequestData] = useFetch();
  const [content, setContent] = useState();

  useEffect(() => {
    feedContentRequest({
      url: "get-messages",
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: selectedChannel.id,
    });
  }, [selectedChannel]);

  useEffect(() => {
    if (feedContentRequestData) {
      if (feedContentRequestData.status) {
      }
    }
  }, [feedContentRequestData]);

  setTimeout(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, 0);

  return (
    <>
      <div id="feed" ref={feedRef}>
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
        <Post />
      </div>
    </>
  );
}
