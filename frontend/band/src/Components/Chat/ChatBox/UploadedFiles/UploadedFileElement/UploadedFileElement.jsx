import "./UploadedFileElement.css";
export default function UploadedFileElement({ file }) {
  return (
    <>
      <div className="uploadedFile-element">
        <div className="uploadedFile-element-img">
          <img src="" />
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
