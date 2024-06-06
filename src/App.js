import React from 'react';
import EmbedVidaAgent from "./components/EmbedVidaAgent";

function App(props) {

  return (
    <div>
      <EmbedVidaAgent agent={props.agent} apiUsername={props.apiUsername} apiToken={props.apiToken} autoRegister={props.autoRegister} size={props.size} />
    </div>
  );
}

export default App;
