import { useContext, useState } from "react";
import { WSContext } from "../Contexts/WSProvider";
/**
 * Custom hook for making fetch requests.
 * @returns {[function,object,boolean]}
 */
export default function useFetch() {
  const { csrfToken } = useContext(WSContext);
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);

  const request = async ({ url, method = "GET", headers, body }) => {
    setLoading(true);
    const data = {
      method: method,
      credentials: "include",
    };
    if (body) data.body = body;
    if (headers) data.headers = headers;
    if (method == "POST")
      data.headers = { ...data.headers, "CSRF-Token": csrfToken };
    try {
      const response = await fetch("http://localhost:3000/" + url, data);
      const _data = await response.json();
      setData(_data);
      if (!response.ok) throw new Error(_data.msg);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  return [request, data, loading];
}
