import "./modal.css";

export default function Modal({ children, props }) {
  return (
    <>
      <div id="modal-backdrop"></div>
      <div id="modal" style={props.style}>
        {children}
      </div>
    </>
  );
}
