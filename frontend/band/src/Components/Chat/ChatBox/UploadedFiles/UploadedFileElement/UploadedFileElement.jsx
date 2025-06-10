import "./UploadedFileElement.css";
export default function UploadedFileElement({ file, index, setUploadedFiles }) {
  return (
    <>
      <div
        className="uploadedFile-element"
        onClick={() => {
          setUploadedFiles((prev) => prev.filter((element, i) => i != index));
        }}
      >
        <div className="uploadedFile-element-img">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2z" />
          </svg>
        </div>
        <div className="uploadedFile-element-info">
          <div className="uploadedFile-element-info-name">
            <span>{file.name}</span>
          </div>
          <div className="uploadedFile-element-info-size">
            <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
    </>
  );
}
