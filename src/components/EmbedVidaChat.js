import 'regenerator-runtime/runtime';
import React from "react";
import { useState, useEffect } from "react";

export default function EmbedVidaChat(props) {
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(props.agent);
  const [targetAccount, setTargetAccount] = useState(null);  
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

  const handleFetchAccount = async () => {
    return fetch(`https://api.vida.dev/api/v1/account/${destination}`)
      .then((res) => {
        if (!res.ok) {
          console.log("Error fetching account!");
        }
        return res.json();
      })
      .then((data) => {
        setTargetAccount(data);
        setLoading(false);
        return data;
      })
      .catch(function () {
        console.log("Error fetching temp user session");
        setLoading(false);
        return false;
      });
  };

  
  useEffect(() => {
    if((!apiUsername || !apiToken)) {
      handleFetchTempUser();
    }
    //if(!targetAccount) {
    //  handleFetchAccount();
    //}    
  }, [apiUsername, apiToken, targetAccount]);

  return (
    <> 
      <div className={`main-container flex flex-row gap-4`}>
        {destination && 
        <>
          <iframe src={`https://vida.io/${destination}?chat=true&chatTarget=${destination}`} className="iframe-embed"/>
        </>
        }
      </div>
    </>
  );
}
