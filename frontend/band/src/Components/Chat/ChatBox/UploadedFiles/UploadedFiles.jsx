import UploadedFileElement from "./UploadedFileElement/UploadedFileElement.jsx";
import "./UploadedFiles.css";
export default function UploadedFiles({ uploadedFiles ,setUploadedFiles}) {
  return (
    <>
      <div id="uploadedFiles-container">
        {uploadedFiles?.map((element, i) => (
          <UploadedFileElement key={i} setUploadedFiles={setUploadedFiles} file={element} index={i} />
        ))}
      </div>
    </>
  );
}
