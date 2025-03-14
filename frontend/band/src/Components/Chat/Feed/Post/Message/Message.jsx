import "./Message.css";

export default function Message({ data }) {
  return (
    <>
      <div className="message">
        <span>{data.text}</span>
      </div>
    </>
  );
}
