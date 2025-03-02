import "./modal.css";

export default function Modal({ children }) {
  return (
    <>
      <div id="modal-backdrop"></div>
      <div id="modal">{children}</div>
    </>
  );
}
