import {
  Calendar,
  Clipboard,
  ClipboardCheck,
  House,
  Link2,
  List,
  MessageCircleQuestion,
  User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "./loader";
import { API_URL } from "../config";

interface Option {
  id: number;
  text: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: Option[];
  votes: Record<string, number>;
}

interface ElectionData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  questions: Question[];
  is_built: boolean;
  orgname: string;
  status: string;
}

const ElectionDetails = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [livelink, setLivelink] = useState("");
  const [voteCount, setVoteCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLInputElement>(null);
  const fullUrl = `${API_URL}/election/${electionId}/liveview`;

  useEffect(() => {
    const fetchElectionDetails = async () => {
      if (!electionId) return;

      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication failed. Please login");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/election?id=${electionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setElectionData({ ...data, status: data.status || "unknown" });
        setQuestionCount(data?.questions_count || 0);

        const liveLinkWithOrgName = `${API_URL}/election/${electionId}/liveview?orgname=${encodeURIComponent(
          data.orgname
        )}`;
        setLivelink(liveLinkWithOrgName);

        const voteResponse = await fetch(
          `${API_URL}/api/results?electionId=${electionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (voteResponse.ok) {
          const voteData = await voteResponse.json();
          const totalVotes = voteData.election.questions.reduce(
            (total: number, question: Question) =>
              total +
              Object.values(question.votes).reduce(
                (sum: number, count: number) => sum + count,
                0
              ),
            0
          );
          setVoteCount(totalVotes);
        }
      } catch (error) {
        const myError = error as { message: string };
        console.error("Error message:", myError.message);
        alert(myError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElectionDetails();
  }, [electionId, fullUrl, navigate]);

  const buildElection = async () => {
    if (!electionId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication failed. Please login");
      navigate("/login");
      return;
    }

    if (questionCount < 1) {
      alert("Add questions before building");
    } else {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/build?electionId=${electionId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        setElectionData((prev) =>
          prev ? { ...prev, is_built: true, status: "active" } : null
        );
      } catch (error) {
        console.error("Error building election:", error);
        alert("Failed to build election. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const previewClick = () => {
    if (electionId) {
      console.log(questionCount);
      if (questionCount !== 0) {
        navigate(`/election/${electionId}/preview`);
      } else {
        alert("Add questions first");
      }
    } else {
      console.error("Election ID not found");
    }
  };

  const liveClick = () => {
    if (electionId && electionData) {
      const url = new URL(
        `/election/${electionId}/liveview`,
        window.location.origin
      );
      url.searchParams.append("orgname", electionData.orgname);
      window.open(url.toString(), "_blank");
    }
  };

  const handleCopy = async () => {
    if (textRef.current && electionData?.is_built) {
      try {
        await navigator.clipboard.writeText(livelink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    }
  };

  const seeResults = () => {
    navigate(`/election/${electionId}/results`);
  };

  const getStatusButton = () => {
    if (!electionData) return null;

    if (!electionData.is_built) {
      return (
        <button
          onClick={buildElection}
          title="Build election"
          className="bg-orange-400 py-1 px-3"
        >
          Building
        </button>
      );
    }

    switch (electionData.status) {
      case "Active":
        return (
          <button
            title="Election is active"
            className="bg-green-500 text-white py-1 px-3"
            disabled={true}
          >
            Active
          </button>
        );
      case "ended":
        return (
          <button
            title="Election has ended"
            className="bg-red-500 text-white py-1 px-3"
            disabled={true}
          >
            Ended
          </button>
        );
      case "upcoming":
        return (
          <button
            title="Election is upcoming"
            className="bg-yellow-500 text-white py-1 px-3"
            disabled={true}
          >
            Building
          </button>
        );
      default:
        return (
          <button
            title="Election status unknown"
            className="bg-gray-400 py-1 px-3"
            disabled={true}
          >
            Unknown
          </button>
        );
    }
  };

  return (
    <div>
      {isLoading && <Loader />}
      <>
        {electionData ? (
          <>
            <p className="font-bold px-2 py-3 bg-white">{electionData.title}</p>
            <div className="flex items-center justify-between bg-white border-y-2 px-3 py-2">
              <div className="flex gap-3">
                <House />
                <p className="font-bold">Overview</p>
              </div>
              {getStatusButton()}
            </div>

            <div className="text-sm mx-auto w-[94%] mt-6">
              <p>
                After setting up and adding questions, build to make it active
                for people to vote. After building, questions cannot be added or
                edited.
              </p>
            </div>

            <div className="mt-6 w-[94%] mx-auto border-2 border-black">
              <div className="border-2 border-b-black gap-3 flex items-center p-2">
                <Calendar size={15} />
                <p className="font-bold">Start Date</p>
              </div>
              <div className="p-2">
                <p>
                  {new Date(electionData.startDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="mt-3 w-[94%] mx-auto border-2 border-black">
              <div className="border-2 border-b-black gap-3 flex items-center p-2">
                <Calendar size={15} />
                <p className="font-bold">End Date</p>
              </div>
              <div className="p-2">
                <p>
                  {new Date(electionData.endDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="mt-3 w-[94%] mx-auto border-2 border-black">
              <div className="border-2 border-b-black gap-3 flex items-center p-2">
                <Link2 size={15} />
                <p className="font-bold">Election Url</p>
              </div>

              <div className="py-3 border-b-2 border-black px-2">
                <p>Preview Url</p>
                <div className="flex flex-row my-1">
                  <input
                    className=" w-[90%] border-slate-500 border-[1px] px-2 py-1"
                    disabled
                    placeholder="Click the button to preview"
                  />
                  <button
                    className={
                      electionData?.status === "ended"
                        ? "bg-gray-400 py-1 px-2"
                        : "bg-green-400 py-1 px-2"
                    }
                    onClick={previewClick}
                    disabled={electionData?.status == "ended"}
                  >
                    Open
                  </button>
                </div>
              </div>

              <div className=" py-3 px-2">
                <p>Live Url</p>
                <div className="flex flex-row my-1 justify-center items-center">
                  <input
                    className="w-[90%] border-slate-500 border-[1px] px-2 py-1"
                    disabled
                    ref={textRef}
                    value={livelink}
                  />

                  <button
                    onClick={handleCopy}
                    className={
                      electionData.is_built
                        ? "bg-green-300 py-[5px] px-[2px] border-r-2 border-black"
                        : "bg-gray-400 py-[5px] px-[2px] border-r-2 border-black"
                    }
                    title={copied ? "Copied!" : "Copy to clipboard"}
                  >
                    {copied ? (
                      <ClipboardCheck size={24} />
                    ) : (
                      <Clipboard size={24} />
                    )}
                  </button>
                  <button
                    disabled={!electionData.is_built}
                    onClick={liveClick}
                    className={
                      electionData.is_built
                        ? "bg-green-400 py-[5px] px-2"
                        : "bg-gray-400 py-[5px] px-2"
                    }
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-orange-400 w-[93%] mx-auto flex justify-between items-center px-3 mt-10 py-2">
              <User size={25} />
              <div className="flex flex-col items-center justify-center font-bold">
                <p>{voteCount}</p>
                <p>Voters</p>
              </div>
            </div>

            <div className="bg-pink-500 w-[93%] mx-auto flex justify-between items-center px-3 mt-4 py-2">
              <MessageCircleQuestion size={25} />
              <div className="flex flex-col font-bold items-center justify-center">
                <p>{questionCount}</p>
                <p>Questions</p>
              </div>
            </div>

            <div className="bg-red-400 w-[93%] mx-auto flex flex-row justify-between items-center px-3 mt-4 py-4">
              <button
                onClick={seeResults}
                className="flex w-[100%] justify-between items-center"
              >
                <List />
                <div className=" font-bold ">
                  <p>Results</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => navigate(`/election/${electionId}/multiple-type`)}
              disabled={
                electionData.is_built || electionData?.status == "ended"
              }
              className={
                electionData.is_built || electionData.status == "ended"
                  ? "bg-gray-400 p-2 w-[93%] mx-auto flex justify-center mt-3 mb-5"
                  : "bg-green-400 p-2 w-[93%] mx-auto flex justify-center mt-3 mb-5"
              }
            >
              Add Question
            </button>
          </>
        ) : (
          <div></div>
        )}
      </>
    </div>
  );
};

export default ElectionDetails;
