import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config";

interface Option {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

const MultipleQs: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!electionId) {
        console.log("No election ID provided");
        return;
      }

      const token = localStorage.getItem("token");
      const url = `${API_URL}/api/questions?election_id=${electionId}`;
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      try {
        const response = await fetch(url, options);
        const textResponse = await response.text();

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (e) {
          console.error("Error parsing JSON:", e);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedQuestions = data.map((q: any) => ({
          id: q.id,
          text: q.question_text,
          options: Array.isArray(q.options)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              q.options.map((opt: any, index: any) => ({
                id: index + 1,
                text: opt,
              }))
            : [],
        }));

        setQuestions(formattedQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [electionId]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      text: "",
      options: [
        { id: 1, text: "" },
        { id: 2, text: "" },
      ],
    };
    //setQuestions([...questions, newQuestion]);
    setQuestions(questions.concat(newQuestion));
  };

  const addOption = (questionId: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.concat({ id: q.options.length + 1, text: "" }), // Use concat to add new option
            }
          : q
      )
    );
  };

  const updateQuestionText = (id: number, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const updateOptionText = (
    questionId: number,
    optionId: number,
    text: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text } : opt
              ),
            }
          : q
      )
    );
  };

  const removeOption = (questionId: number, optionId: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((opt) => opt.id !== optionId),
            }
          : q
      )
    );
  };

  const handleSubmit = async () => {
    if (!electionId) {
      console.error("No election ID provided");
      return;
    }

    try {
      const questionsData = questions.map((question) => ({
        election_id: electionId,
        question_text: question.text,
        question_type: "multiple_choice",
        options: question.options.map((opt) => opt.text),
      }));
      console.log(questionsData);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token gotten. Login");
      }
      const url = `${API_URL}/api/questions`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(questionsData),
      };
      const response = await fetch(url, options);
      const data = await response.json();
      console.log("Questions submitted successfully:", data);
      localStorage.removeItem("questions");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting questions:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-5 text-center">
        Add Questions for Election
      </h2>
      {questions.map((question) => (
        <div key={question.id} className="mb-6 p-4 bg-green-600 border rounded">
          <input
            className="w-full p-2 mb-2 font-bold border-black rounded"
            placeholder="Question"
            value={question.text}
            onChange={(e) => updateQuestionText(question.id, e.target.value)}
          />
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center mb-2">
              <input
                className="w-full p-2  border rounded"
                placeholder={`Option ${option.id}`}
                value={option.text}
                onChange={(e) =>
                  updateOptionText(question.id, option.id, e.target.value)
                }
              />
              {option.id > 2 && (
                <button
                  className="bg-red-500 ml-2 p-1"
                  onClick={() => removeOption(question.id, option.id)}
                >
                  <X size={30} />
                </button>
              )}
            </div>
          ))}
          <button
            className="flex items-center text-black font-semibold hover:cursor-pointer mt-2"
            onClick={() => addOption(question.id)}
          >
            Add Option
          </button>
        </div>
      ))}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        onClick={addQuestion}
      >
        Add Question
      </button>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded mt-4 ml-2"
        onClick={handleSubmit}
      >
        Submit Questions
      </button>
    </div>
  );
};

export default MultipleQs;
