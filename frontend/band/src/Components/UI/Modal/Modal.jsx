import "./modal.css";

export default function Modal({ children, backdropStyle, style, close }) {
  return (
    <>
      <div
        id="modal-backdrop"
        onClick={close?.backdrop}
        style={backdropStyle}
      ></div>
      <div id="modal" style={style}>
        {children}
      </div>
    </>
  );
}
