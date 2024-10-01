import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "./loader";
import { API_URL } from "../config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = {
      email,
      password,
    };
    const url = `${API_URL}/api/login`;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message);
        return;
      }

      const data = await response.json();
      const token = data.access_token;
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting signup:", error);
      alert("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      {isLoading && <Loader />}
      <p className="font-bold text-2xl text-center my-10">Login</p>

      <form
        className="flex flex-col justify-center items-center"
        onSubmit={submitForm}
      >
        <input
          placeholder="Email"
          className="border-black italic  border-2 rounded-sm px-5 py-2 w-[80%] my-2 sm:w-[60%]"
          type="email"
          id="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />

        <input
          placeholder="Password"
          className="border-black italic border-2 rounded-sm px-5 py-2 w-[80%] my-2 sm:w-[60%]"
          type="password"
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />

        <button
          className="bg-green-500 text-white w-[80%] sm:w-[60%] py-2 rounded-sm hover:bg-green-600 font-bold mt-2"
          type="submit"
        >
          Login
        </button>
      </form>

      <p className="text-sm text-center my-2">
        Don't have an account?{" "}
        <Link to="/" className="text-blue-500">
          Sign up
        </Link>
      </p>
    </>
  );
};

export default Login;
