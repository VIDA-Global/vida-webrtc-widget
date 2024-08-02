import 'regenerator-runtime/runtime';
import { useState, useEffect } from "react";

export default function EmbedVidaChat(props) {
  const [apiUsername, setApiUsername] = useState(null);
  const [apiToken, setApiToken] = useState(null);

  const handleFetchTempUser = async () => {
    return fetch(`https://api.vida.dev/api/v1/allocateTempUserSession`)
      .then((res) => {
        if (!res.ok) {
          console.log("Error fetching temp user session!");
        }
        return res.json();
      })
      .then((data) => {
        setApiToken(data.token);
        setApiUsername(data.username);
        return data;
      })
      .catch(function () {
        console.log("Error fetching temp user session");
        return false;
      });
  }

  useEffect(() => {
    if ((!apiUsername || !apiToken)) {
      handleFetchTempUser();
    }
  }, []);

  if (!apiUsername || !apiToken || !props.agent) {
    return "Loading...";
  }

  return (
    <div>
      <iframe
        src={`http://localhost:3000/embedChat?chatTarget=${props.agent}&token=${apiToken}&username=${apiUsername}`}
        height={640}
        width={480}
      />
    </div>
  );
}
