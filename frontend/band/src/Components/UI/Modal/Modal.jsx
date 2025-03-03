import "./modal.css";

export default function Modal({ children ,backdropStyle , stlye}) {
  return (
    <>
      <div id="modal-backdrop" style={backdropStyle}></div>
      <div id="modal" style={stlye}>{children}</div>
    </>
  );
}
