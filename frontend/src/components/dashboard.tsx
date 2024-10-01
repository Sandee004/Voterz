import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import Loader from "./loader";
import { API_URL } from "../config";

interface Election {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

const Dashboard = () => {
  const [fetchedElections, setFetchedElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElections = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("Authorization failed. Pls login");
          navigate("/login");
          //console.log("No token. Sign in");
        }

        const url = `${API_URL}/api/election`;
        const options = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await fetch(url, options);

        if (response.status !== 200) {
          throw new Error("Failed to fetch elections, send help!!");
        }

        const data = await response.json();
        //console.log(data);
        setFetchedElections(data);
      } catch (error) {
        const myError = error as { message: string };
        console.error("Error message:", myError.message);
        alert(myError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElections();
  }, [navigate]);

  const handleElectionClick = (electionId: string) => {
    navigate(`/election/${electionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-row justify-between items-center px-3 py-3 bg-white">
        <p className="text-xl font-bold">Dashboard</p>
        <button className="px-2 py-2 bg-green-500 font-bold">
          <Link to="/create-election">New Election</Link>
        </button>
      </div>

      {isLoading ? ( // Conditionally render loader or list
        <Loader />
      ) : fetchedElections.length > 0 ? (
        <div className="election-list my-2 w-[96%] mx-auto">
          {fetchedElections.map((election) => (
            <div
              key={election.id}
              className="border-black border-2 py-2 my-3 px-1 hover:cursor-pointer hover:bg-slate-300"
              onClick={() => handleElectionClick(election.id)}
            >
              <p className="font-bold mx-3">{election.title}</p>
              <div className="text-sm flex flex-row justify-between mx-3 text-sm">
                <div className="flex flex-col">
                  <p>Start Date: </p>
                  <p>{formatDate(election.startDate)}</p>
                </div>
                <div>
                  <p>End Date:</p>
                  <p>{formatDate(election.endDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center">You haven't created any elections yet.</p>
      )}
    </>
  );
};

export default Dashboard;
