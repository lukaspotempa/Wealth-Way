import Scene from "./components/Scene";
import GameSetup from "./components/ui/GameSetup";
import GameHUD from "./components/ui/GameHUD";
import EventModal from "./components/ui/EventModal";

function App() {
  return (
    <>
      <Scene />
      <GameSetup />
      <GameHUD />
      <EventModal />
    </>
  );
}

export default App;
