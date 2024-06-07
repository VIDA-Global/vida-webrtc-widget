import 'regenerator-runtime/runtime';
import React from "react";
import { useState, useEffect } from "react";
import WebRTCClient from "./WebRTCClient";

export default function EmbedVidaAgent(props) {
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(props.agent);
  const [targetAccount, setTargetAccount] = useState(null);
  const [hangupCallNow, setHangupCallNow] = useState(false);
  const [toggleAudioMute, setToggleAudioMute] = useState(false);
  const [initiateCallNow, setInitiateCallNow] = useState(false);
  const [showMediaError, setShowMediaError] = useState(false);
  const [autoRegister, setAutoRegister] = useState(false);
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
        console.log("Temp user info")
        console.log(data)
        localStorage.setItem("username", data.username);
        localStorage.setItem("token", data.token);
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
        console.log("Fetched Account")
        console.log(data)
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

  const handleStartCall = async () => {
    console.log("Starting call...")
    console.log(apiUsername)
    console.log(apiToken)
    if(!apiUsername || !apiToken) {
      console.log("fetching temp account first")
      await handleFetchTempUser()
    }
    setAutoRegister(true)
    setStatus("CONNECTING");
    setTimeout(function() {
      setInitiateCallNow(true);
    }, 1000);
    
  };

  const handleDisconnect = () => {
    console.log("disconnect");
    console.log("hangup call now");
    console.log(hangupCallNow)

    setInitiateCallNow(false);
    setHangupCallNow(false);
    setStatus("DISCONNECTED");

  };

  const handleHangup = () => {
    console.log("hangup");

    setHangupCallNow(true);
    setInitiateCallNow(false);
    setStatus("DISCONNECTED");
    setTimeout(function() {
      setStatus(null);
    }, 3000)
  };

  const handleConnected = () => {
    setStatus("CONNECTED");
  };

  const handleMediaError = (error) => {
    console.log("MEDIA ACCESS ERROR");
    console.log(error);
    setShowMediaError(true);
  };

  const handleToggleAudio = async () => {
    setToggleAudioMute(!toggleAudioMute);
  };

  
  
  useEffect(() => {
    console.log(apiUsername)
    console.log(apiToken)
    if((!apiUsername || !apiToken) && autoRegister) {
      handleFetchTempUser();
    }
    //if(!targetAccount) {
    //  handleFetchAccount();
    //}
    console.log(props.autoRegister)
  }, [apiUsername, apiToken, targetAccount, autoRegister]);

  return (
    <> 
      <div className={`main-container text-white flex flex-row gap-4 ${status && status == "CONNECTED" ? "main-container-expanded" : ""}`}>
        {destination && 
        <>
          <div className={`avatar-container flex flex-row items-center gap-1 ${status && status == "CONNECTING" ? "loading" : ""}`}>
            <button
              className="avatar-button curser-pointer flex-shrink-0"
              onClick={() => handleStartCall()}
              >
              <img src="https://vidapublic.s3.us-east-2.amazonaws.com/vida-icon-blue.png" className="avatar-logo rounded-full w-14" />
            </button>
            {(!status || (status === "DISCONNECTED" || status === "CONNECTING")) && 
            <div className="avatar-text font-bold">
              <div className="mt-1 text-xs text-white text-center">
                {!status  && <div className="welcome-text">{props.welcome || "Talk to our AI!"}</div>}
                {status === "CONNECTING" && <div>calling...</div>}
                {status === "DISCONNECTED" && <div>ended...</div>}
              </div>
            </div>
            }
            {(status && status === "CONNECTED") && 
            <div className="call-buttons flex flex-col content-center place-content-end gap-2 text-xs ">
              <div className="flex items-center">
                <button
                  className="rounded-2xl bg-gray py-1 px-2"
                  onClick={handleToggleAudio}
                >
                  {toggleAudioMute ? "Unmute" : "Mute"}
                </button>
              </div>
              <div className="flex items-center">
                <button
                  className="rounded-2xl bg-warning py-1 px-2"
                  onClick={handleHangup}
                >
                  End
                </button>
              </div>
            </div>
            }
          </div>          
        </>
        }
        {!destination && !loading && 
          <div className="flex flex-row items-center text-center gap-2">You must configure a Vida Agent username on your HTML element.</div>
        }
      </div>
      <video id="localVideo" className="hidden" autoPlay playsInline />
      <video id="remoteVideo" className="hidden" autoPlay playsInline />
      {apiUsername && apiToken && autoRegister &&
        <div className="hidden">
          <WebRTCClient
            video={false}
            autoRegister={true}
            sipDomain={"sip.vida.dev"}
            sipServer={"sip.vida.dev"}
            sipUser={apiUsername}
            sipPassword={apiToken}
            iceTransportPolicy={"relay"}
            destination={destination}
            autoConnect={false}
            autoAnswer={false}
            hideControls={true}
            hideConnectionStatus={true}
            traceSip={false}
            alertVideoUrl="/alert.mp4"
            ringbackVideoUrl="/ringback.mp4"
            onHangup={handleDisconnect}
            onDisconnected={handleDisconnect}
            onConnected={handleConnected}
            onMediaError={handleMediaError}
            hangupCallNow={hangupCallNow}
            toggleAudioNow={toggleAudioMute}
            initiateCallNow={initiateCallNow}
          />
        </div>
      }      
    </>
  );
}
