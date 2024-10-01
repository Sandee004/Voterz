import React, { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

interface Response {
  question_id: number;
  answer: string;
}

const Liveview: React.FC = () => {
  const [orgName, setOrgname] = useState<string | null>(null);
  const [electionTitle, setElectionTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { electionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orgnameParam = searchParams.get("orgname");

    if (orgnameParam) {
      setOrgname(orgnameParam);
    }
  }, [location]);

  useEffect(() => {
    const getUserInfo = async () => {
      setIsLoading(true);
      const url = `${API_URL}/api/liveview?electionId=${electionId}`;
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      };
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error("Failed to fetch election data");
        }
        const data: UserInfo = await response.json();
        setElectionTitle(data.election.title);

        setQuestions(
          data.election.questions.map((q) => ({
            ...q,
            answered: false,
          }))
        );
        //setQuestions(data.election.questions);
      } catch (error) {
        const myError = error as { message: string };
        console.error("Error message:", myError.message);
        alert(myError.message);
      } finally {
        setIsLoading(false);
      }
    };
    getUserInfo();
  }, [electionId]);

  const handleOptionChange = (questionId: number, answer: string) => {
    setResponses((prevResponses) => {
      const existingResponseIndex = prevResponses.findIndex(
        (r) => r.question_id === questionId
      );
      if (existingResponseIndex !== -1) {
        return prevResponses.map((r) =>
          r.question_id === questionId ? { ...r, answer } : r
        );
      } else {
        return [...prevResponses, { question_id: questionId, answer }];
      }
    });
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, answered: true } : q))
    );
  };

  const submitBallot = async (e: FormEvent) => {
    e.preventDefault();
    const hasUnanswered = questions.some((q) => !q.answered);
    if (hasUnanswered) {
      alert("Please answer all questions before submitting");
      return;
    }

    const data = {
      election_id: electionId,
      responses: responses,
    };

    const url = `${API_URL}/api/submit_ballot`;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 400) {
          // Handle 400 error specifically
          const errorData = await response.json();
          throw new Error(errorData.message);
        } else {
          throw new Error("Failed to submit ballot");
        }
      }
      const result = await response.json();
      console.log(result.message);
      navigate("/thanks");
    } catch (error) {
      const myError = error as { message: string };
      console.error("Error message:", myError.message);
      alert(myError.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {isLoading && <Loader />}
      <div className="bg-green-500 text-white p-4 rounded-lg shadow-md mb-6">
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
                        className="form-radio h-5 w-5 text-green-600"
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
        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300"
      >
        Submit Ballot
      </button>
    </div>
  );
};

export default Liveview;
