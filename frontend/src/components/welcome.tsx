import { Link } from "react-router-dom";

const Welcome = () => {
    return (
        <>
            <p>Welcome to Voterz!</p>
            <p>Get started by creating your first election</p>

            <button className="bg-green-600 px-5 py-2">
                <Link to="/create-election">New Election</Link>
            </button>
        </>
    );
};

export default Welcome;
