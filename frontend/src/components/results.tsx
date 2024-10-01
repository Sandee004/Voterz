import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { API_URL } from "../config";

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  votes: { [key: string]: number };
}

interface Election {
  id: number;
  title: string;
  questions: Question[];
}

interface UserInfo {
  id: number;
  orgname: string;
  election: Election;
}

const Results: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { electionId } = useParams();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/results?electionId=${electionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          setError(
            `Error fetching results: ${response.status} - ${response.statusText}\n${errorText}`
          );
          return;
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        setError("Error fetching results: Network Error");
        console.log(err);
      }
    };

    fetchResults();
  }, [electionId]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p className="text-xl text-center font-bold my-5">
        Results: {userInfo.election.title}
      </p>

      <div className="border rounded-lg mb-4 w-[92%] mx-auto overflow-hidden">
        {userInfo.election.questions.map((question) => (
          <div>
            <div
              key={question.id}
              className="flex justify-between items-center p-4 bg-gray-100 bg-white border-black cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              <h2>{question.question_text}</h2>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {isOpen && (
              <div className="p-4 bg-slate-200" key={question.id}>
                <ul>
                  {question.options.map((option) => (
                    <div className="flex justify-between items-center mb-2">
                      <p key={option} className="">
                        {option}
                      </p>
                      <span className="font-semibold">
                        {question.votes[option] || 0} votes
                      </span>
                    </div>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;
