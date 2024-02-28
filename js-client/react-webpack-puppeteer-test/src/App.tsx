import "./App.css";
import Retrieve from "./components/Retrieve";
import Status from "./components/Status";
import Store from "./components/Store";
import Compute from "./components/Compute";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Status />
      <Store />
      <Retrieve />
      <Compute />
    </div>
  );
}

export default App;
