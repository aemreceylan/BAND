import "./modal.css";

export default function Modal({ children ,backdropStyle , style}) {
  return (
    <>
      <div id="modal-backdrop" style={backdropStyle}></div>
      <div id="modal" style={style}>{children}</div>
    </>
  );
}
