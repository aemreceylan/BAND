import UploadedFileElement from "./UploadedFileElement/UploadedFileElement.jsx";
import "./UploadedFiles.css";
export default function UploadedFiles({ uploadedFiles }) {
  return (
    <>
      <div id="uploadedFiles-container">
        {uploadedFiles?.map((element, i) => (
          <UploadedFileElement key={i} file={element} />
        ))}
      </div>
    </>
  );
}
