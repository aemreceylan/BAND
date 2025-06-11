import "./Message.css";
import MessageFile from "./MessageFile/MessageFile";
export default function Message({ data }) {
  return (
    <>
      <div className="message">
        <span>{data.text}</span>
        {data.file.length > 0 && <MessageFile file={data.file} />}
      </div>
    </>
  );
}
