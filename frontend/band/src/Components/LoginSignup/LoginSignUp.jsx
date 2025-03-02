import { useContext, useState } from "react";
import Modal from "../UI/Modal/Modal";
import "./LoginSignup.css";
import { WSContext } from "../../Contexts/WSProvider";

export default function LoginSignup() {
  const [isRegisterScreen, setIsRegisterScreen] = useState(false);
  const { setLogin, setSocket, io } = useContext(WSContext);
  return (
    <>
      <Modal>
        <div id="loginSignup">
          <div id="loginSignup-top-title">
            <span>{isRegisterScreen ? "Kayıt Ol" : "Giriş Yap"}</span>
          </div>
          <form
            id="loginSignup-form"
            onSubmit={(e) => {
              e.preventDefault();
              let formData = new FormData(e.target);
              formData = Object.fromEntries(formData.entries());
              if (isRegisterScreen) {
                fetch("http://localhost:3000/signup", {
                  headers: {
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                  body: JSON.stringify(formData),
                })
                  .then((response) => {
                    if (response.ok) {
                      return response.text();
                    } else {
                      return response.text().then((text) => {
                        throw new Error(text);
                      });
                    }
                  })
                  .then((text) => {
                    console.log(text);
                    setIsRegisterScreen(false);
                  })
                  .catch((err) => console.log(err));
              } else {
                fetch("http://localhost:3000/login", {
                  headers: {
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                  body: JSON.stringify(formData),
                })
                  .then((response) => {
                    if (response.ok) {
                      return response.text();
                    } else {
                      return response.text().then((text) => {
                        throw new Error(text);
                      });
                    }
                  })
                  .then((text) => {
                    console.log(text);
                    setLogin(true);
                    setSocket(
                      io("localhost:3000", {
                        auth: formData,
                      })
                    );
                  })
                  .catch((err) => console.log(err));
              }
            }}
          >
            <input type="text" minLength={6} placeholder="RUMUZ" name="nick" />
            <input
              type="password"
              minLength={5}
              placeholder="PAROLA"
              name="password"
            />
            {isRegisterScreen && (
              <input
                type="password"
                minLength={5}
                placeholder="PAROLA"
                name="password_confirm"
              />
            )}
            <button type="submit">
              <span>{isRegisterScreen ? "Kayıt Ol" : "Giriş Yap"}</span>
            </button>
          </form>
          <div id="loginSignup-bottom-title">
            <span>
              {isRegisterScreen ? "Zaten kayıt oldun mu?" : "Üye değil misin?"}
            </span>
            <div
              id="loginSignup-bottom-title-signup-button"
              onClick={() => {
                setIsRegisterScreen((prev) => !prev);
              }}
            >
              <span>{isRegisterScreen ? "Giriş Yap" : "Kayıt Ol"}</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
