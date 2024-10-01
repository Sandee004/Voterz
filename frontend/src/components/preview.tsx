import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "./loader";
import { API_URL } from "../config";

interface Option {
  id?: string;
  text: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: Option[] | string[];
  answered: boolean;
}

interface Election {
  id: string;
  title: string;
  questions: Question[];
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  orgtype: string;
  orgname: string;
  election: Election;
}

const Preview: React.FC = () => {
  const [orgName, setOrgname] = useState<string | null>(null);
  const [electionTitle, setElectionTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { electionId } = useParams();
  console.log(electionId);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication failed. Please login");
        return;
      }
      setIsLoading(true);
      const url = `${API_URL}/api/preview?electionId=${electionId}`;
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error("Failed to fetch election data");
        }
        const data: UserInfo = await response.json();
        console.log(data);
        setOrgname(data.orgname);
        setElectionTitle(data.election.title);

        setQuestions(
          data.election.questions.map((q) => ({
            ...q,
            answered: false,
          }))
        );
        //setQuestions(data.election.questions);
      } catch (error) {
        console.error("Error fetching election data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getUserInfo();
  }, [electionId]);

  const handleOptionChange = (questionId: number, answer: string) => {
    console.log("Selected answer:", answer);
    setQuestions((prevQuestions) => {
      const existingResponseIndex = prevQuestions.findIndex(
        (r) => r.id === questionId
      );
      if (existingResponseIndex !== -1) {
        return prevQuestions.map((r) =>
          r.id === questionId ? { ...r, answered: true } : r
        );
      } else {
        return prevQuestions.map((q) =>
          q.id === questionId ? { ...q, answered: true } : q
        );
      }
    });
  };

  const submitBallot = async (e: FormEvent) => {
    e.preventDefault();
    const hasUnanswered = questions.some((q) => !q.answered);
    if (hasUnanswered) {
      alert("Please answer all questions before submitting");
      return;
    } else {
      navigate(`/election/${electionId}/thanks-preview`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {isLoading && <Loader />}
      <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-center">{orgName}</h1>
        <h2 className="text-xl text-center mt-2">{electionTitle}</h2>
      </div>

      {questions.map((question) => (
        <div
          key={question.id}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {question.question_text}
          </h3>

          {question.question_type === "multiple_choice" && (
            <div className="space-y-2">
              {question.options &&
                question.options.map((option, index) => {
                  const optionText =
                    typeof option === "string" ? option : option.text;
                  return (
                    <label
                      key={`${question.id}-${index}`}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        required
                        type="radio"
                        name={`question-${question.id}`}
                        value={optionText}
                        onChange={(e) =>
                          handleOptionChange(question.id, e.target.value)
                        }
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="text-gray-700">{optionText}</span>
                    </label>
                  );
                })}
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        onClick={submitBallot}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300"
      >
        Submit Ballot
      </button>
    </div>
  );
};

export default Preview;
