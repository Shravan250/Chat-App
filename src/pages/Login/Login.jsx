import React, { useState } from "react";
import "./Login.css";
import assets from "../../assets/assets.js";
import { signup, login, resetPass } from "../../config/firebase.js";

const Login = () => {
  const [currState, setCurrState] = useState("Sign Up");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitHandler = (e) => {
    e.preventDefault();
    if (currState === "Sign Up") {
      signup(username, email, password);
    } else {
      login(email, password);
    }
  };

  return (
    <>
      <div className="login">
        <img src={assets.logo_big} alt="" className="logo" />
        <form className="login-form" onSubmit={submitHandler}>
          <h2>{currState}</h2>
          {currState === "Sign Up" ? (
            <input
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              type="text"
              placeholder="Username"
              className="form-input"
              required
            />
          ) : null}
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Email address"
            className="form-input"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Password"
            className="form-input"
          />
          <button type="submit">
            {currState === "Sign Up" ? "Create Account" : "Login"}
          </button>
          <div className="login-term">
            <input type="checkbox" />
            <p>Agree to the Terms of use & privacy policy.</p>
          </div>
          <div className="login-forgot">
            {currState === "Sign Up" ? (
              <p className="login-toggle">
                Already have an account{" "}
                <span onClick={() => setCurrState("Login")}>Login here</span>
              </p>
            ) : (
              <p className="login-toggle">
                Create an account{" "}
                <span onClick={() => setCurrState("Sign Up")}>click here</span>
              </p>
            )}
            {currState === "Login" ? (
              <p className="login-toggle">
                Forgot Password{" "}
                <span onClick={() => resetPass(email)}>reset here</span>
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
