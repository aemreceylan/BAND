export default function useWait(data) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (
        (typeof data != "object" && data != null && data != undefined) ||
        (typeof data == "object" && Array.isArray(data) && data.length > 0)
      ) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
}
