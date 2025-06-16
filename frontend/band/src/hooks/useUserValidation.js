import { useState } from "react";

/**
 * Custom hook for user validation.
 * @returns {[function,boolean]}
 */

export default function useUserValidation() {
  const [result, setResult] = useState();

  const userValidation = async (authToken) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/user-validation",
        {
          credentials: "include",
          method: "GET",
        }
      );
      const data = await response.json();
      if (!response.ok && !data.status) throw new Error(data.msg);
      console.log(data.msg);
      setResult(true);
    } catch (err) {
      console.log("User validation error : " + err);
      setResult(false);
    }
  };

  return [userValidation, result];
}
