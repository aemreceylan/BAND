import "./ChatBox.css";

export default function ChatBox() {
  return (
    <>
      <div id="chatbox">
        <div id="chatbox-textarea">
          <textarea placeholder={`#${"Kanal"} kanalına mesaj gönder...`}></textarea>
        </div>
        <div id="chatbox-buttons">
        </div>
      </div>
    </>
  );
}
