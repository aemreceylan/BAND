import "./UserFileSystemElement.css";
export default function UserFileSystemElement({ data }) {
  return (
    <>
      <div
        className={`${
          data.isHeader
            ? "userFileSystem-element-list-header"
            : "userFileSystem-files-element-list-row"
        } ${
          data.type === "list"
            ? "userFileSystem-element-list"
            : data.type === "grid"
            ? "userFileSystem-element-grid"
            : ""
        }`}
      >
        <div>{data.file.name}</div>
        <div>{data.file.size}</div>
        <div>{data.file.date}</div>
      </div>
    </>
  );
}
