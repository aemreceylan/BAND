import { useCallback, useState } from "react";
import useWait from "./useWait";
import { _csrfToken as csrfToken } from "../Contexts/WSProvider";
/**
 * Custom hook for making fetch requests.
 * @returns {[function,object,boolean]}
 */
export default function useFetch() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async ({ url, method = "GET", headers, body }) => {
      const wait = useWait(csrfToken);
      setLoading(true);
      const data = {
        method: method,
        credentials: "include",
      };
      if (body) data.body = body;
      if (headers) data.headers = headers;
      if (method == "POST") {
        await wait;
        data.headers = { ...data.headers, "CSRF-Token": csrfToken[0] };
      }
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
    },
    []
  );
  return [request, data, loading];
}
