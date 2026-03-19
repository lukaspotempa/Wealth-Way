import Scene from "./components/Scene";
import GameSetup from "./components/ui/GameSetup";
import GameHUD from "./components/ui/GameHUD";
import EventModal from "./components/ui/EventModal";
import GoalModal from "./components/ui/GoalModal";
import MarketFlash from "./components/ui/MarketFlash";
import GameOver from "./components/ui/GameOver";

function App() {
  return (
    <>
      <Scene />
      <GameSetup />
      <GameHUD />
      {/* MarketFlash sits above EventModal — timeline events interrupt between turns */}
      <MarketFlash />
      <EventModal />
      <GoalModal />
      <GameOver />
    </>
  );
}

export default App;
