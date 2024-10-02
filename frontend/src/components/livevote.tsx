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

interface ElectionData {
  orgname: string;
  election: Election;
}

const LiveVote: React.FC = () => {
  const [orgName, setOrgname] = useState<string | null>(null);
  const [electionTitle, setElectionTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const getElectionInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/live?electionId=${electionId}`
        );
        console.log("Got data i believe");
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData);
          throw new Error(errorData.message || "Failed to fetch election data");
        }
        if (response.status == 400) {
          const statusText = await response.json();
          console.log(statusText);
        }
        const data: ElectionData = await response.json();
        console.log(data);
        setOrgname(data.orgname);
        setElectionTitle(data.election.title);
        setQuestions(
          data.election.questions.map((q) => ({
            ...q,
            answered: false,
          }))
        );
      } catch (error) {
        console.error("Error fetching election data:", error);
        alert(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    getElectionInfo();
  }, [electionId]);

  const handleOptionChange = (questionId: number, answer: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === questionId ? { ...q, answered: true } : q
      )
    );
  };

  const submitBallot = async (e: FormEvent) => {
    e.preventDefault();
    const hasUnanswered = questions.some((q) => !q.answered);
    if (hasUnanswered) {
      alert("Please answer all questions before submitting");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/submit_ballot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          election_id: electionId,
          responses: Object.entries(responses).map(([questionId, answer]) => ({
            question_id: parseInt(questionId),
            answer,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit ballot");
      }

      navigate(`/thanks`);
    } catch (error) {
      console.error("Error submitting ballot:", error);
      alert(error instanceof Error ? error.message : "Failed to submit ballot");
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
        onClick={submitBallot}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
      >
        Submit Ballot
      </button>
    </div>
  );
};

export default LiveVote;
