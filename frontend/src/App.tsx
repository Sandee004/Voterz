import Signup from "./components/signup";
import Login from "./components/login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateElection from "./components/create-election";
import Welcome from "./components/welcome";
import ElectionDetails from "./components/election-details";
import Dashboard from "./components/dashboard";
import MultipleQs from "./components/multipleQs";
import Preview from "./components/preview";
import Thanks from "./components/thanks";
import Results from "./components/results";
import Liveview from "./components/live-view";
import ThanksPreview from "./components/thanks-preview";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/create-election" element={<CreateElection />} />
        <Route path="/election/:electionId" element={<ElectionDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/election/:electionId/multiple-type"
          element={<MultipleQs />}
        />
        <Route path="/election/:electionId/preview" element={<Preview />} />
        <Route path="/thanks" element={<Thanks />} />
        <Route
          path="/election/:electionId/thanks-preview"
          element={<ThanksPreview />}
        />
        <Route path="/election/:electionId/results" element={<Results />} />
        <Route path="/election/:electionId/liveview" element={<Liveview />} />
      </Routes>
    </Router>
  );
};

export default App;
