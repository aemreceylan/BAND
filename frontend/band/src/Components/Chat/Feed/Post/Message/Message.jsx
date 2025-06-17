import "./Message.css";
import MessageFile from "./MessageFile/MessageFile";
export default function Message({ data }) {
  function parseLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return part;
    });
  }
  return (
    <>
      <div className="message">
        <span>{parseLinks(data.text)}</span>
        {Array.isArray(data.file) && data.file.length > 0 && (
          <MessageFile file={data.file} />
        )}
      </div>
    </>
  );
}
