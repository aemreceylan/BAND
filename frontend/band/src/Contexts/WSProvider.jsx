import { createContext } from "react";

const WSContext = createContext();

const contextValue = {};

export default function WSProvider({ children }) {
  return (
    <>
      <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>
    </>
  );
}
