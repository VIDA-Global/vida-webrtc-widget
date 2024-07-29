import React from 'react';
import EmbedVidaAgent from "./components/EmbedVidaAgent";
import EmbedVidaChat from "./components/EmbedVidaChat";
import EmbedSchedulingForm from "./components/EmbedSchedulingForm";

function App(props) {

  return (
    <div>
      {props.mode === 'scheduling' ? (
        <EmbedSchedulingForm agent={props.agent} />
      ) : (
        props.mode === 'chat' ? (
          <EmbedVidaChat agent={props.agent} />
        ) : (
          <EmbedVidaAgent agent={props.agent} welcome={props.welcome} size={props.size} />
        )
      )}
    </div>
  );
}

export default App;
