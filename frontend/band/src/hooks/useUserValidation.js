import { useEffect, useState } from "react";

export default function useUserValidation() {
  const [result, setResult] = useState();

  const userValidation = async (id) => {
    try {
      const response = await fetch("http://localhost:3000/user-validation", {
        headers: {
          authorization: id,
        },
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok && !data.status) throw new Error(data.msg);
      console.log(data.msg);
      setResult(true);
    } catch (err) {
      console.log("User validation error : " + err);
      setResult(false);
    }
  };

  return { userValidation, result };
}
