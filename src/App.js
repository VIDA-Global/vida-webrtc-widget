import React from 'react';
import EmbedVidaAgent from "./components/EmbedVidaAgent";

function App(props) {

  return (
    <div>
      <EmbedVidaAgent agent={props.agent} welcome={props.welcome} size={props.size} />
    </div>
  );
}

export default App;
