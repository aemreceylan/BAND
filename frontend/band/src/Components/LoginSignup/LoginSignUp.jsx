import { useContext, useEffect, useRef, useState } from "react";
import Modal from "../UI/Modal/Modal";
import "./LoginSignup.css";
import { WSContext } from "../../Contexts/WSProvider";
import useFetch from "../../hooks/useFetch";

export default function LoginSignup() {
  const [isRegisterScreen, setIsRegisterScreen] = useState(false);
  const formDataRef = useRef();
  const { setLogin, setSocket, io, setAuthToken, inviteToken, setInviteToken } =
    useContext(WSContext);
  const [signupRequest, signupRequestData] = useFetch();
  const [loginRequest, loginRequestData] = useFetch();

  useEffect(() => {
    if (signupRequestData) {
      if (signupRequestData.status) {
        console.log(signupRequestData.msg);
        setIsRegisterScreen(false);
        setInviteToken(null);
        window.location.href = window.location.origin;
      } else {
        console.log(signupRequestData.msg);
      }
    }
  }, [signupRequestData]);

  useEffect(() => {
    if (loginRequestData) {
      if (loginRequestData.status) {
        setLogin(true);
        setAuthToken(loginRequestData.authToken);
        console.log(loginRequestData.msg);
        setSocket(
          io("localhost:3000", {
            auth: { authToken: loginRequestData.authToken },
          })
        );
        window.location.href = window.location.origin;
      } else {
        console.log(loginRequestData.msg);
      }
    }
  }, [loginRequestData]);

  return (
    <>
      <Modal
        backdropStyle={{ backgroundColor: "var(--dark-background-dark-gray)" }}
      >
        <div id="loginSignup">
          <div id="loginSignup-top-title">
            <span>{isRegisterScreen ? "Kayıt Ol" : "Giriş Yap"}</span>
          </div>
          <form
            id="loginSignup-form"
            onSubmit={async (e) => {
              e.preventDefault();
              formDataRef.current = new FormData(e.target);
              formDataRef.current = Object.fromEntries(
                formDataRef.current.entries()
              );
              formDataRef.current.inviteToken = inviteToken;
              if (isRegisterScreen) {
                signupRequest({
                  url: "api/signup",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                  body: JSON.stringify(formDataRef.current),
                });
              } else {
                setInviteToken(null);
                loginRequest({
                  url: "api/login",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                  body: JSON.stringify(formDataRef.current),
                });
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
