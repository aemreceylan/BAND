import { useState } from "react";
/**
 * Custom hook for making fetch requests.
 * @returns {[function,object]}
 */
export default function useFetch() {
  const [data, setData] = useState();

  const request = async ({ url, method="GET", headers, body }) => {
    const data = {
      method: method,
    };
    if (body) data.body = body;
    if(headers) data.headers= headers;
    try {
      const response = await fetch("http://localhost:3000/" + url, data);

      const _data = await response.json();
      setData(_data);
      if (!response.ok) throw new Error(_data.msg);
    } catch (err) {
      console.log(err);
    }
  };
  return [request, data];
}
