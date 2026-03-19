import Scene from "./components/Scene";
import GameSetup from "./components/ui/GameSetup";
import GameHUD from "./components/ui/GameHUD";
import EventModal from "./components/ui/EventModal";
import GoalModal from "./components/ui/GoalModal";
import GameOver from "./components/ui/GameOver";

function App() {
  return (
    <>
      <Scene />
      <GameSetup />
      <GameHUD />
      <EventModal />
      <GoalModal />
      <GameOver />
    </>
  );
}

export default App;
