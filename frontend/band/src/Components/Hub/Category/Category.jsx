import Channel from "./Channel/Channel";
import "./Category.css";
import { useState, useEffect } from "react";

export default function Category({ data }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (localStorage.getItem("categoryIsOpen")) {
      const categoryIsOpen = JSON.parse(localStorage.getItem("categoryIsOpen"));
      if (categoryIsOpen[data.name]) return categoryIsOpen[data.name];
      else {
        categoryIsOpen[data.name] = false;
        localStorage.setItem("categoryIsOpen", JSON.stringify(categoryIsOpen));
        return false;
      }
    }
  });
  useEffect(() => {
    localStorage.setItem(
      "categoryIsOpen",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("categoryIsOpen")),
        [data.name]: isOpen,
      })
    );
  }, [isOpen]);
  return (
    <>
      <div className="hub-category">
        <div
          className="hub-category-header"
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
        >
          <span>
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"
                />
              </svg>
            )}
            {" " + data.name}
          </span>
        </div>
        <div
          className={
            isOpen
              ? "hub-category-channelList-open"
              : "hub-category-channelList-close"
          }
        >
          {data.channels?.map((element, index) => {
            return <Channel key={index} data={element} />;
          })}
        </div>
      </div>
    </>
  );
}
