import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const CreateElection = () => {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const navigate = useNavigate();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setEndDateError("");
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();

    const endDateObj = new Date(endDate);
    const startDateObj = new Date(startDate);

    if (endDateObj <= startDateObj) {
      setEndDateError("End date cannot be before or same as the start date.");
      return;
    }
    const data = {
      title,
      startDate,
      endDate,
    };
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication failed. Pls login");
    }
    const url = `${API_URL}/api/election`;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      const responseData = await response.json();
      const electionId = responseData.id;

      if (electionId) {
        console.log("Election created successfully:", electionId);
        navigate(`/election/${electionId}`);
      } else {
        console.error("No election ID received in response");
      }
    } catch (error) {
      const myError = error as { message: string };
      console.error("Error message:", myError.message);
      alert(myError.message);
    }
  };

  return (
    <div>
      <p className="text-3xl text-center py-10 mb-5">Create An Election</p>
      <div className="bg-white w-[90%] px-2 py-5 mx-auto text-left rounded-sm">
        <form
          className="flex flex-col justify-center sm:items-center"
          onSubmit={submitForm}
        >
          <label className="text-sm font-bold">Title</label>
          <input
            className="border-black italic border-2 rounded-sm px-5 py-2 w-[98%] mb-7 sm:w-[60%]"
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            required
          />

          {/* Start Date Input */}
          <label className="text-sm font-bold" htmlFor="startDate">
            Start Date:
          </label>
          <input
            type="date"
            className="border-black italic border-2 rounded-sm px-5 py-2 w-[98%] mb-7 sm:w-[60%]"
            id="startDate"
            value={startDate}
            onChange={handleStartDateChange}
          />

          {/* End Date Input */}
          <label className="text-sm font-bold" htmlFor="endDate">
            End Date:
          </label>
          <input
            type="date"
            className="border-black italic  border-2 rounded-sm px-5 py-2 w-[98%] mb-7 sm:w-[60%]"
            id="endDate"
            value={endDate}
            onChange={handleEndDateChange}
            required
          />

          {/* Error Message (optional) */}
          {endDateError && (
            <p className="text-red-500 text-left">{endDateError}</p>
          )}

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-300 text-white px-5 py-2"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateElection;
