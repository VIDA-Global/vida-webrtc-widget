import React from 'react';
import EmbedVidaAgent from "./components/EmbedVidaAgent";
import EmbedVidaChat from "./components/EmbedVidaChat";
import EmbedSchedulingForm from "./components/EmbedSchedulingForm";

function App(props) {
  switch (props.mode) {
    case 'scheduling': return <EmbedSchedulingForm agent={props.agent} />;
    case 'chat': return <EmbedVidaChat agent={props.agent} />;

    default: return <EmbedVidaAgent agent={props.agent} welcome={props.welcome} size={props.size} />
  }
}

export default App;
