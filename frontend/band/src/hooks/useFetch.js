import { useState } from "react";

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

      if ((!response.ok, !_data.status)) throw new Error(_data.msg);
    } catch (err) {
      console.log(err);
    }
  };
  return {request,data}
}
