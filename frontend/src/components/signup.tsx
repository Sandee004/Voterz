import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "./loader";
import { API_URL } from "../config";

const Signup = () => {
  //const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("");
  const [orgname, setOrgname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = {
      username,
      email,
      password,
      type,
      orgname,
    };
    const url = `${API_URL}/api/signup`;
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
      console.log("User created successfully");
      navigate("/login");
    } catch (error) {
      const myError = error as { message: string };
      console.error("Error message:", myError.message);
      alert(myError.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      {isLoading && <Loader />}
      <p className="font-bold text-2xl text-center my-10">Register</p>

      <form
        className="flex flex-col justify-center items-center"
        onSubmit={submitForm}
      >
        <input
          placeholder="Name"
          className="border-black italic  border-2 rounded-sm px-5 py-2 w-[80%] my-2 sm:w-[60%]"
          type="text"
          id="name"
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />

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

        <select
          className="border-black italic border-2 rounded-sm px-5 py-2 w-[80%] my-2 sm:w-[60%]"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
          }}
        >
          <option value="">Type of Business</option>
          <option value="School">School</option>
          <option value="Organisation">Organisation</option>
        </select>

        {type && ( // Conditionally render fields based on type
          <>
            {type === "School" && (
              <div className="w-[100%] flex flex-col justify-center items-center">
                <input
                  placeholder="School Name"
                  className="border-black italic border-2 rounded-sm px-5 py-2 w-[80%] my-2 sm:w-[60%]"
                  type="text"
                  id="schoolName"
                  value={orgname}
                  onChange={(e) => {
                    setOrgname(e.target.value);
                  }}
                />
              </div>
            )}
            {type === "Organisation" && (
              <div className="w-[100%] flex flex-col justify-center items-center">
                <input
                  placeholder="Organisation Name"
                  className="border-black italic border-2 rounded-sm px-5 py-2 w-[80%] my-2 sm:w-[60%]"
                  type="text"
                  id="org-name"
                  value={orgname}
                  onChange={(e) => {
                    setOrgname(e.target.value);
                  }}
                />
              </div>
            )}
          </>
        )}

        <button
          className="bg-green-500 text-white w-[80%] sm:w-[60%] py-2 rounded-sm hover:bg-green-300 font-bold mt-2"
          type="submit"
        >
          SignUp
        </button>
      </form>
      <p className="text-sm text-center my-2">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500">
          Login
        </Link>
      </p>
    </>
  );
};

export default Signup;
