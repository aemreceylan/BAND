import "./Module.css";
export default function Module({ data }) {
  return (
    <>
      <div className="hub-module" onClick={data.onClick}>
        <div className="hub-module-icon">{data.icon}</div>
        <div className="hub-module-title">
          <span>{data.name}</span>
        </div>
      </div>
    </>
  );
}
