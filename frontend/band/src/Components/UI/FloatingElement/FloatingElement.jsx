import { useEffect, useRef, useState } from "react";
import "./FloatingElement.css";
export default function FloatingElement({ children, styles, coordinate }) {
  const containerRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [coords, setCoords] = useState([0,0]);
  useEffect(() => {
    if (!Array.isArray(coordinate) || coordinate.length != 2) {
      setCoords([window.innerWidth / 2, window.innerHeight / 2]);
    } else setCoords(coordinate);
  }, []);
  return (
    <>
      <div
        ref={containerRef}
        className="floatingElement-container"
        onMouseDown={() => {
          setIsDragging(true);
        }}
        onMouseUp={() => {
          if (isDragging) setIsDragging(false);
        }}
        onMouseLeave={() => {
          if (isDragging) setIsDragging(false);
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            const x = e.clientX - e.target.offsetWidth / 2;
            const y = e.clientY - e.target.offsetHeight / 2;
            setCoords([x, y]);
          }
        }}
        style={{
          ...styles,
          left: `${coords[0]}px`,
          top: `${coords[1]}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div className="floatingElement-container-sub">{children}</div>
      </div>
    </>
  );
}
