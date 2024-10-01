import { useNavigate, useParams } from "react-router-dom";

const ThanksPreview = () => {
  const { electionId } = useParams();
  console.log(electionId);
  const navigate = useNavigate();
  const returnHome = () => {
    if (electionId) {
      navigate(`/election/${electionId}`);
    }
  };
  return (
    <div className="flex justify-center items-center flex-col">
      <div className="bg-blue-500 text-center text-white p-4 shadow-md mb-6">
        <h2 className="text-2xl font-bold">Thanks for voting!</h2>
        <p>Do spare a few seconds to share to your friends as well</p>
      </div>
      <button
        onClick={returnHome}
        className="bg-blue-400 text-center w-[80%] hover:bg-blue-600 py-2 text-white"
      >
        Return
      </button>
    </div>
  );
};

export default ThanksPreview;
