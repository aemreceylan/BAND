export default function userValidation(id) {
  return new Promise(async (resolve, reject) => {
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
      resolve(true);
    } catch (err) {
      console.log("User validation error : "+err);
      resolve(false);
    }
  });
}
