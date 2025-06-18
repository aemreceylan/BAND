import { useEffect } from "react";
import "./ContextMenu.css";
export default function ContextMenu({ data }) {
  useEffect(() => {
    if (!data.coords || !data.coords.x || !!data.coords.y) {
      data.isVisible = false;
    }
  }, [data]);
  return (
    <>
      <div
        id="contextMenu"
        style={{
          left: data.coords?.x + "px",
          top: data.coords?.y + "px",
          display: data.isVisible ? "flex" : "none",
        }}
      >
        <ul>
          {data.items?.map((element, i) => (
            <li key={i} onClick={element.function}>
              {element.text}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
