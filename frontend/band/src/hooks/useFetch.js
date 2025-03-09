import { useState } from "react";
/**
 * Custom hook for making fetch requests.
 * @returns {[function,object]}
 */
export default function useFetch() {
  const [data, setData] = useState();

  const request = async ({ url, method, headers, body }) => {
    try {
      const response = await fetch("http://localhost:3000/" + url, {
        method: method,
        headers: headers,
        body: body,
      });

      const _data = await response.json();
      setData(_data);
      if (!response.ok) throw new Error(_data.msg);
    } catch (err) {
      console.log(err);
    }
  };
  return [request, data];
}
