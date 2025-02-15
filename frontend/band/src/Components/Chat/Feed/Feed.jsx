import Post from "./Post/Post";
import "./Feed.css";
import { useRef } from "react";

export default function Feed() {
    const feed = useRef();

    setTimeout(()=>{
      if (feed.current) {
        feed.current.scrollTop = feed.current.scrollHeight;
      }
    },0)

  return (
    <>
      <div id="feed" ref={feed}>
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
