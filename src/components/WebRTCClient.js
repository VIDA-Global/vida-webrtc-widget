/* eslint-disable no-console */
//
// Copyright (c) IOT Communications International . All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
//

/*jslint node: true */
/*jslint white:true */
/*jslint for:true */

"use strict";

import React, { Component } from "react";
import * as SIP from './CustomSip.js'

//import ringback from "./ringback.mp4";
//import alert from "./alert.mp4";
import PropTypes from "prop-types";
const {detect} = require("detect-browser");

// eslint-disable-next-line
const adapter = require('webrtc-adapter');
/*
var videoResolutionConstraints = {
  width: {min: 640, max: 1280, ideal: 1280},
  height: {min: 360, max: 720, ideal: 720},
  frameRate: {min: 30, max: 60, ideal: 30, exact: 30},
};
*/
var videoResolutionConstraints = {
  width: 1280,
  height: 720
};

var audioInputOptions = []
var audioOutputOptions = []
var videoInputOptions = []
var inputOutputSelectors = [audioInputOptions, audioOutputOptions, videoInputOptions];
//var recordingData = [];
var recordingStatus = [];
var bwInterval = null;
var allMediaStreams = [];

class WebRTCClient extends Component {



  constructor(props,context) {
    super(props,context);
    var sipServer = props.sipDomain;
    if(props.sipServer) {
      sipServer=props.sipServer;
    }

    var callLabel = "Call";
    if(this.props.callLabel) {
      callLabel = this.props.callLabel;
    }


    var remoteVideo = "remoteVideo";
    if(props.remoteVideo) {
      remoteVideo = props.remoteVideo;
    }

    var localVideo = "localVideo";
    if(props.localVideo) {
      localVideo = props.localVideo;
    }
    this.initialState = {
      userid:props.sipUser,
      video:props.video,
      domain:props.sipDomain,
      destination: props.destination,
      sipServer:sipServer,
      password:props.sipPassword,destination:props.destination,
      metaData:props.metaData,
      jwtAuth: props.jwtAuth,
      autoRegister: props.autoRegister,callState:"Idle",
      enableButtons:true,
      ringbackVideoUrl:props.ringbackVideoUrl,
      alertVideoUrl:props.alertVideoUrl,
      callLabel: callLabel,
      remoteVideo : remoteVideo,
      localVideo: localVideo,
      isAudioMuted: false,
      isVideoMuted: false,
      isScreenSharing: false,
      isRecording: false,
      mediaTested:false,
      mediaSupported:false,
      usingHttps: false,
      video: props.video,
      removeCodecs: props.removeCodecs,
      campaignId: props.campaignId
    }
    this.state = this.initialState;
  }

  componentDidUpdate(prevProps) {
    // console.log("componentDidUpdate prevProps",prevProps, "props",this.props);
    if(this.props.removeCodecs !== prevProps.removeCodecs) {
      console.log("Setting removeCodecs")
      this.setState({"removeCodecs": this.props.removeCodecs})
    }
    if(this.props.campaignId !== prevProps.campaignId) {
      console.log("Setting campaignId")
      this.setState({"campaignId": this.props.campaignId})
    }
    if(this.props.video !== prevProps.video) {
      console.log("Setting video")
      this.setState({"video": this.props.video})
    }
    if(this.props.testMediaNow != prevProps.testMediaNow) {
      if(this.props.testMediaNow) {
        console.log("testing media")
        this.testMedia();
      }
    }
    if(this.props.hangupCallNow != prevProps.hangupCallNow  && this.state.callState=="InCall") {
      if(this.props.hangupCallNow) {
        console.log("hanging up call")
        this.hangupCall();
      }
    }
    if(this.props.answerCallNow != prevProps.answerCallNow && this.state.callState=="Alerting") {
      if(this.props.answerCallNow) {
        console.log("answering call")
        var testorstart = function(parent) {
          if(!parent.state.mediaTested) {
            console.log("waiting for media")
            setTimeout(testorstart.bind(null, parent), 2000);
          }
          else {
            var context = this;
            setTimeout(function() {
              context.testMedia();  
            }, 2000);
            
            parent.setState({"video": parent.props.video})
            parent.answerCall(parent.props.video);
          }
        }
        this.testMedia();
        testorstart(this);
      }
    }
    if(this.props.rejectCallNow != prevProps.rejectCallNow && this.state.callState=="Alerting") {
      if(this.props.rejectCallNow) {
        console.log("rejecting call")
        this.rejectCall();
      }
    }
    if(this.props.initiateCallNow != prevProps.initiateCallNow && this.state.callState=="Idle") {
      if(this.props.initiateCallNow) {
        console.log("initiating call")
        console.log(this.state.destination)
        console.log("video state")
        console.log(this.state.video)
        var testCounter = 0;
        var errorShown = false;
        var testorstart = function(parent) {
          if(!parent.state.mediaTested) {
            console.log("waiting for media")
            testCounter = testCounter + 1;
            setTimeout(testorstart.bind(null, parent), 2000);
            if(testCounter > 5 && !errorShown) {
              errorShown = true;
              console.log("invoking onMediaError callback in waiter");
              if(parent.props.onMediaError) {
                parent.props.onMediaError();
              }
            }
          }
          else {
            parent.placeCall();
          }
        }
        this.testMedia();
        testorstart(this);
      }
    }
    if(this.props.reinviteCallNow != prevProps.reinviteCallNow) {
      if(this.props.reinviteCallNow) {
        console.log("reinviting call")
        console.log(this.state.destination)
        console.log("video state")
        console.log(this.state.video);
        this.reinvite();
      }
    }
    if(this.props.destination != prevProps.destination && this.state.callState=="Idle") {
      console.log("Setting Destination")
      this.setState({"destination": this.props.destination})
    }
    if(this.props.toggleAudioNow != prevProps.toggleAudioNow && this.state.callState=="InCall") {
      console.log("Toggling Audio")
      this.toggleMute("audio");
    }
    if(this.props.toggleVideoNow != prevProps.toggleVideoNow && this.state.callState=="InCall") {
      console.log("Toggling Video")
      this.toggleMute("video");
    }
    if(this.props.toggleScreenshareNow != prevProps.toggleScreenshareNow && this.state.callState=="InCall") {

      if(!this.state.isScreenSharing) {
        console.log("Enabling Screenshare")
        this.startScreenShare();
      }
      else {
        console.log("Disabling Screenshare")
        this.stopScreenShare();
      }
    }
    if(this.props.updateAudioOutputDevice != prevProps.updateAudioOutputDevice) {
      console.log("Updating Audio Output Device ID: "+this.props.updateAudioOutputDevice)
      this.props.setDefaultAudioOutputDevice(this.props.updateAudioOutputDevice)
    }
    if(this.props.updateAudioInputDevice != prevProps.updateAudioInputDevice) {
      console.log("Updating Audio Input Device ID: "+this.props.updateAudioInputDevice)
      this.props.setDefaultAudioInputDevice(this.props.updateAudioInputDevice)
      this.replaceAudioVideoTrack(this.props.updateAudioInputDevice, this.props.updateVideoInputDevice)
    }
    if(this.props.updateVideoInputDevice != prevProps.updateVideoInputDevice) {
      console.log("Updating Video Input Device ID: "+this.props.updateVideoInputDevice)
      this.props.setDefaultVideoInputDevice(this.props.updateVideoInputDevice)
      this.replaceAudioVideoTrack(this.props.updateAudioInputDevice, this.props.updateVideoInputDevice)
    }
    if(this.props.toggleRecordingNow != prevProps.toggleRecordingNow && this.state.callState=="InCall") {

      if(!this.state.isRecording) {
        console.log("Enabling Recording")
        this.startLocalRecording();
      }
      else {
        console.log("Disabling Recording")
        this.stopLocalRecording();
      }
    }

  }

  //UNSAFE_componentWillMount() {
  //  this.setState(this.initialState);
  //}

  async componentDidMount() {
    this.setState(this.initialState);
    //this.testMedia();
    var traceSip = false;
    if(this.props.traceSip) {
      traceSip = this.props.traceSip;
    }

    /*
    {
        audio: true,
        video: {
          width: { exact: 1280 },
          height: { exact: 720 }
        }
      }
    */    

    var options = {
      uri: this.state.userid +"@" + this.state.domain,
      transportOptions: {
        wsServers: ["wss://"+this.state.sipServer+":7443/ws"],
        traceSip:traceSip
      },
       sessionDescriptionHandlerFactoryOptions: {
        peerConnectionOptions: {          
          iceCheckingTimeout: 6000,
          iceTransportPolicy: (this.props.iceTransportPolicy) ? this.props.iceTransportPolicy : "all",
          iceCandidatePoolSize: 3,
          rtcConfiguration: {
            rtcpMuxPolicy: 'negotiate',
            iceServers: [
              {
                urls: 'stun:stun3.l.google.com:19302'
              },
              {
                urls: 'stun:turn.vida.dev:3478'
              },
              {
                urls: 'turn:turn.vida.dev:3478?transport=udp',
                username: '4ea629e2e2efe065f4ccb3bdfd6b6b083fed0808',
                credential: '4so7NvXYWsV45T03Errjiap2PJ8'
              },
              {
                urls: 'turn:turn.vida.dev:3478?transport=tcp',
                username: '4ea629e2e2efe065f4ccb3bdfd6b6b083fed0808',
                credential: '4so7NvXYWsV45T03Errjiap2PJ8'
              },
            ],
            iceCheckingTimeout: 6000,
            iceTransportPolicy: (this.props.iceTransportPolicy) ? this.props.iceTransportPolicy : "all",
            iceCandidatePoolSize: 3,
          }          
        },
        constraints: {
          audio: true,
          video: (this.state.video) ? videoResolutionConstraints : this.state.video 
        }
      },
      log: {
        builtinEnabled: true
      },
      authorizationUser: this.state.userid,
      password: this.state.password,
      autostart: false,
      //hackIpInContact:true,
      hackWssInTransport:true,
      register: false
    };

    this.connectionStateChanged("Disconnected");


    this.sipUa = new  SIP.UA(options);
    console.log("SIP UA")
    console.log(this.sipUa)

    this.sipUa.once("transportCreated",  (transport) =>  {

      transport.on("transportError", () => {
        this.setState({error:"Network connection error"});
      });

      transport.on("connecting", () => {
        this.connectionStateChanged("Connecting...");
      });

      transport.on("connected", () => {
        console.log("Transport connected, props",this.props);
        this.connectionStateChanged("Connected");
        this.setState({error:""});
        if(this.props.autoRegister) {
          this.register();
        }

        if(this.props.autoConnect) {
          console.log("Auto connecting");
          this.placeCall();
        }
      });

      transport.on("disconnecting", () => {
        this.connectionStateChanged("Disonnecting...");
      });

      transport.on("disconnected", () => {
        this.connectionStateChanged("Disonnected");
      });




    });

    this.sipUa.on("invite", (session)=>{
      this.incomingCall(session);
    });




    this.sipUa.start();






    //this.setState({userid: localStorage.getItem('userid'), domain: localStorage.getItem('domain'),websocket: localStorage.getItem('websocket'),routes: localStorage.getItem('routes'), password: localStorage.getItem('password')},()=>{this.updateSIPSettings()});
  }

  connectionStateChanged(newState) {
    this.setState({connectionState:newState});
  }

  handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }
  gotDevices(deviceInfos, context) {
    // Handles being called several times to update labels. Preserve values.
    var parent = this;

    /*
    const values = inputOutputSelectors.map(select => select.value);
    inputOutputSelectors.forEach(select => {
      while (select.firstChild) {
        select.removeChild(select.firstChild);
      }
    });
    */

    //var audioInputOptions = []
    //var audioOutputOptions = []
    //var videoInputOptions = []
    //var inputOutputSelectors =
    var audioSupported = false;
    var videoSupported = false;
    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      console.log(deviceInfo)
      //const option = document.createElement('option');
      var option = {
        value: "",
        text: ""
      }
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === 'audioinput') {
        audioSupported = true;
        option.text = deviceInfo.label || `microphone ${audioInputOptions.length + 1}`;
        audioInputOptions.push(option);
      } else if (deviceInfo.kind === 'audiooutput') {
        option.text = deviceInfo.label || `speaker ${audioOutputOptions.length + 1}`;
        audioOutputOptions.push(option);
      } else if (deviceInfo.kind === 'videoinput') {
        videoSupported = true;
        option.text = deviceInfo.label || `camera ${videoInputOptions.length + 1}`;
        videoInputOptions.push(option);
      } else {
        console.log('Some other kind of source/device: ', deviceInfo);
      }
    }    
    console.log(inputOutputSelectors)
    console.log("running device list")
    if(context.props.onDeviceOptions) {
      console.log("running device list callback")
      context.props.onDeviceOptions(inputOutputSelectors);
    }

    var usingHttps=false;
    if (window.location.protocol === "https:") {
      usingHttps=true;
    }
    if(!videoSupported) {
      console.log("no camera attached. setting video off.")
      if(this.props.onNoCameraDetected) {
        console.log("invoking onNoCameraDetected callback 1");
        this.props.onNoCameraDetected();
      }
      this.setState({"video": false})
      videoSupported = false;
      //videoResolutionConstraints = {mediaSource: 'screen'}
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: (this.state.video && videoSupported) ? videoResolutionConstraints : false })
    //navigator.mediaDevices.getDisplayMedia({ audio: true, video: {mediaSource: 'screen'}})
      .then( (stream) =>  {
        console.log("adding stream in main getUserMedia")
        allMediaStreams.push(stream);
        console.log("getUserMedia stream")
        console.log(stream)
        parent.origStream = stream;
        this.setState({mediaTested:true,mediaSupported:true,  audioSupported: audioSupported, videoSupported: videoSupported, usingHttps:usingHttps});
      })
      .catch((e) => {
        console.log(e)
        if(this.props.onMediaError) {
          console.log("invoking onMediaError callback 1");
          this.props.onMediaError(e);
        }
        this.setState({mediaTested:true,mediaSupported:false, audioSupported: audioSupported, videoSupported: videoSupported, usingHttps:usingHttps});
      });
  }

  testMedia() {
    var usingHttps=false;
    if (window.location.protocol === "https:") {
      usingHttps=true;
    }
    var parent = this;
    if(navigator.mediaDevices) {
      console.log("RUNNING FETCH DEVICES")
      var context = this;
      try {
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
          context.gotDevices(devices, context)
        })
      }
      catch(e) {
        /*
        if(this.props.onMediaError) {
          console.log("invoking onMediaError Device Fetch callback");
          this.props.onMediaError(e);
        }
        */
        this.handleError(e)
      }

    } else {
      var browser = detect();
      if(this.props.onMediaError) {
        console.log("invoking onMediaError callback 2");
        this.props.onMediaError(browser);
      }
      this.setState({mediaTested:true,mediaSupported:false, audioSupported: false, videoSupported: false, usingHttps:usingHttps,browser:browser.name, os:browser.os});

    }
  }

  hangupCall() {
    console.log("hangupCall called");

    try {
      this.currentSession.bye();
    }
    catch(e) {
      try {
        this.currentSession.cancel();
      }
      catch(e) {
        console.log(e)
      }

    }

    try {
      this.currentSession.terminate();
      // eslint-disable-next-line
    } catch (e) {
      console.log(e)
      console.log("error ending call")
    }

  }


  handleCall(session) {
    var localVideo = document.getElementById(this.state.localVideo);
    this.currentSession = session;
    var context = this;
    setTimeout(function() {
      console.log("getting devices again")
      context.testMedia();  
    }, 2000);


    this.currentSession.on("terminated", () => {
      //alert("terminated")
      console.log("fest -- terminated")

      //if(this.state.isRecording) {
      //  this.stopLocalRecording();
      //}

      if(this.localStream) {

        //alert("stop local")      
        console.log("fest -- stop local")
        console.log(this.localStream)
        //console.log(this.localStream)
        this.localStream.getTracks().forEach(track => {
          console.log("stopping local stream")
          track.stop();
          track.enabled = false
        });
        this.localStream = null;
      }
      if(this.remoteStream) {
        //alert("stop remote")
        console.log("fest -- stop remote")
        console.log(this.remoteStream)
        //console.log(this.remoteStream)
        this.remoteStream.getTracks().forEach(track => {
          console.log("stopping remote stream")
          track.stop();
          track.enabled = false
        });
        this.remoteStream = null;
      }
      if(this.screenshareStream) {
        //alert("stop screenshare")
        console.log("fest -- stop screenshare")
        this.screenshareStream.getTracks().forEach(track => {
          console.log("stopping screenshare stream")
          track.stop();
          track.enabled = false
        });
        this.screenshareStream = null;
      }
      if(this.origStream) {        
        //alert("stop orig")
        console.log("fest -- stop orig")
        console.log(this.origStream)
        //console.log(this.origStream)
        this.origStream.getTracks().forEach(track => {
          console.log("stopping orig stream")
          track.stop();
          track.enabled = false
        });
        console.log(this.origStream)
        this.origStream = null;
      }      

      console.log("allMediaStreams")
      console.log(allMediaStreams)
      for(var streamId in allMediaStreams) {
        var thisStream = allMediaStreams[streamId];
        console.log("fest -- stop stream" +streamId)
        console.log(thisStream)
        //console.log(thisStream)
        thisStream.getTracks().forEach(track => {
          console.log("stopping stream "+streamId)
          track.stop();
          track.enabled = false
        });
        console.log(thisStream)
        thisStream = null;
      }
      allMediaStreams = [];

      var localVideo = document.getElementById(this.state.localVideo);
      console.log(this.state.localVideo)
      var remoteVideo = document.getElementById(this.state.remoteVideo);
      console.log(this.state.remoteVideo)
      if(localVideo) {
        //alert("killing local")
        console.log("fest -- killing local")
        localVideo.pause();
        localVideo.src="";
        localVideo.srcObject = null;
        localVideo.removeAttribute("src");
        localVideo.removeAttribute("loop");
      }
      if(remoteVideo) {
        //alert("killing remote")
        console.log("fest -- killing remote")
        remoteVideo.pause();
        remoteVideo.src="";
        remoteVideo.srcObject = null;
        remoteVideo.removeAttribute("src");
        remoteVideo.removeAttribute("loop");
      }
      
      this.setState({callState:"Idle"});

      if(this.props.onDisconnected) {
        console.log("invoking onDisconnected callback");
        this.props.onDisconnected(this);
      }
      if(bwInterval) {
        clearInterval(bwInterval)  
      }
    });

    this.currentSession.on("accepted", () => {
      this.setState({callState:"InCall"});
      localVideo = document.getElementById(this.state.localVideo);
      console.log("on accepted")
      console.log(localVideo)
      this.callConnected();
      var parent = this;
      //setTimeout(function() {parent.reinvite()}, 5000)      

      if(this.props.onConnected) {
        console.log("invoking onConnected callback");
        this.props.onConnected(this);
      }

    });

    this.currentSession.on("cancel", () => {
      this.setState({callState:"Canceling"});
    });

    this.currentSession.on("rejected", (response,cause) => {
      this.setState({error:"Call failed: " + cause});
    });


    this.currentSession.on("SessionDescriptionHandler-created", () => {
      //const pc = this.currentSession.sessionDescriptionHandler.peerConnection;
      //const videoSender = pc.getSenders().find(sender => sender.track.kind === 'video');
      //pc.removeTrack(videoSender);
      this.currentSession.sessionDescriptionHandler.on("getDescription", (sdpWrapper)=> {
        console.log("sdpWrapper")
        console.log(sdpWrapper)
      });
      this.currentSession.sessionDescriptionHandler.on("userMediaRequest", (constraints)=> {
        console.log("user media request")
        console.log(constraints)
      });
      this.currentSession.sessionDescriptionHandler.on("userMediaFailed", (e)=> {
        console.log("Local User Media Failed!")
        console.log(e)
      });
    });

    
    this.currentSession.on("trackAdded", async (event) => {
      console.log("On TrackAdded!!!!!!!!!!!!")
      console.log(event)
      
      localVideo = document.getElementById(this.state.localVideo);
      // We need to check the peer connection to determine which track was added
      if(this.currentSession.sessionDescriptionHandler) {
        if(this.currentSession.sessionDescriptionHandler.peerConnection) {
          var parent = this;          
          var pc = this.currentSession.sessionDescriptionHandler.peerConnection;
          // Gets remote tracks
          parent.remoteStream = new MediaStream();
          parent.receiverStatsTrack = null;
          parent.senderStatsTrack = null;
          pc.getReceivers().forEach(function(receiver) {
            if(receiver.track) {
              if(receiver.track.kind == "audio") {
                console.log("tracking audio receiver track")
              }
              if(receiver.track.kind == "video") {
                console.log("tracking video receiver track")
                parent.receiverStatsTrack = receiver.track;
              }
              parent.remoteStream.addTrack(receiver.track);              
            }
          });

          // Gets local tracks
          parent.localStream = new MediaStream();

          pc.getSenders().forEach(function(sender) {
            if(sender.track) {
              parent.localStream.addTrack(sender.track);              
              console.log("Local stream sender track!")
              console.log(sender.track)
              if(sender.track.kind == "audio") {
                console.log("setting default audio device ID")
                console.log(sender.track.getSettings().deviceId)
                if(parent?.props?.setDefaultAudioInputDevice) {
                  parent.props.setDefaultAudioInputDevice(sender.track.getSettings().deviceId)  
                }                
              }
              if(sender.track.kind == "video") {
                console.log("setting default video device ID")
                console.log(sender.track.getSettings().deviceId)
                if(parent?.props?.setDefaultVideoInputDevice) {
                  parent.props.setDefaultVideoInputDevice(sender.track.getSettings().deviceId)
                }
                console.log("tracking video sender track")
                parent.senderStatsTrack = sender.track;
              }

            }
          });          
          if(this.state.video) {
            this.props.onLocalVideo(parent.localStream);
            setTimeout(() => {
              localVideo = document.getElementById(this.state.localVideo);
              //console.log("local video while looping tracks")
              //console.log(localVideo)
              try {
                localVideo.srcObject = parent.localStream;
                localVideo.play().catch(()=>{});
              }
              catch(e) {
                console.log(e)
                console.log("problem setting local video")
              }
            }, 2000);
          }
          
          if(parent.receiverStatsTrack && parent.senderStatsTrack && !bwInterval) {
            console.log("setting bw interval!")
            parent.restartStatInterval()
          }
        }
      }
    });
  }

  restartStatInterval() {
    if(!this.state.video) {
      return;
    }
    console.log("restarting bw stats interval")
    var parent = this;
    var lastRTimestamp = null;
    var lastRBytesReceived = null;
    var lastRPacketsLost = null;
    var lastSTimestamp = null;
    var lastSBytesSent = null;
    var lastSPacketsRetry = null;
    var lastSBytesReceived = null;
    if(bwInterval) {
      clearInterval(bwInterval);
    }
    bwInterval = setInterval(() => {
      this.currentSession.sessionDescriptionHandler.peerConnection.getStats(parent.receiverStatsTrack)
        .then(stats => {
          var timestamp = null;
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind == "video") {
              const bytesReceived = report.bytesReceived;
              const packetsLost = report.packetsLost;
              //console.log(`packetsLost: ${packetsLost}`)
              timestamp = report.timestamp;
              if(lastRBytesReceived !== null && lastRTimestamp !== null) {
                var downBw = ((bytesReceived - lastRBytesReceived) / (timestamp - lastRTimestamp)) * 8;
                //console.log("==========================")
                //console.log(`Receiver Inbound bandwidth: ${downBw} kbps`);
                if(parent.props.onDownloadBandwidth) {
                  this.props.onDownloadBandwidth(downBw);
                }                
              }
              if(lastRPacketsLost !== null && lastRTimestamp !== null) {
                var downPacketsLost = ((packetsLost - lastRPacketsLost) / (timestamp - lastRTimestamp));
                //console.log(`downPacketsLost: ${downPacketsLost}`)
                if(parent.props.onDownloadPacketsLost) {
                  this.props.onDownloadPacketsLost(downPacketsLost);
                }
              }
              lastRBytesReceived = bytesReceived;
              lastRPacketsLost = packetsLost;
            }
          });
          lastRTimestamp = timestamp;
        })
        .catch(error => {
          console.log("errror in receiver Video track stats")
          console.error(error);
        });
      
      this.currentSession.sessionDescriptionHandler.peerConnection.getStats(parent.senderStatsTrack)
        .then(stats => {
          var timestamp = null;
          stats.forEach(report => {
            if (report.type === 'outbound-rtp' && report.kind == "video") {
              const bytesSent = report.bytesSent;
              const packetsRetry = report.retransmittedPacketsSent;
              //console.log(`packetsRetry: ${packetsRetry}`)
              timestamp = report.timestamp;                    
              if(lastSBytesSent !== null && lastSTimestamp !== null) {
                var upBw = ((bytesSent - lastSBytesSent) / (timestamp - lastSTimestamp)) * 8;                
                //console.log("==========================")
                //console.log(`Sender Upload bandwidth: ${upBw} kbps`);
                if(parent.props.onUploadBandwidth) {
                  this.props.onUploadBandwidth(upBw);
                }                
              }
              if(lastSPacketsRetry !== null && lastSTimestamp !== null) {
                //var upPacketsRetry = ((packetsRetry - lastSPacketsRetry) / (timestamp - lastSTimestamp)) * 8;
                var upPacketsRetry = ((packetsRetry - lastSPacketsRetry) / (timestamp - lastSTimestamp));
                //console.log(`upPacketsRetry: ${upPacketsRetry}`)
                if(parent.props.onUploadPacketsRetry) {
                  this.props.onUploadPacketsRetry(upPacketsRetry);
                }
              }
              lastSBytesSent = bytesSent;
              lastSPacketsRetry = packetsRetry;
            }
          });
          lastSTimestamp = timestamp;
        })
        .catch(error => {
          console.log("errror in sender Video track stats")
          console.error(error);
        });
    }, 1000); // Get stats every second
  }

  answerCall(overrideVideo) {
    var parent = this;
    var answerVideo = this.state.video;
    if(overrideVideo !== undefined) {
      answerVideo = overrideVideo;
    }
    if(this.currentSession) {
      try {
        console.log("ANSWERING WITH VIDEO ENABLED")
        console.log(overrideVideo)
        this.setState({error:""});
        var myModifier = function(description) {
          if(parent.state.removeCodecs) {
            var codecs = parent.state.removeCodecs.split(",")
            for(var codecIn in codecs) {
              console.log("removing codec from offer: "+codecs[codecIn])
              description.sdp = parent.removeCodec(description.sdp, codecs[codecIn])
            }
          }
          return Promise.resolve(description);
        };
        this.currentSession.accept({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: (answerVideo) ? videoResolutionConstraints : answerVideo
            }
          }
        }, [myModifier]);
        // eslint-disable-next-line
      } catch (e) {
        console.log("Error answering call")
        console.log(e);
      }
    }
  }

  rejectCall() {
    if(this.currentSession) {
      try {
        this.setState({error:""});
        this.currentSession.reject();
        // eslint-disable-next-line
      } catch (e) {
        console.log("Error rejecting call")
        console.log(e);
      }
    }
  }

  toggleMute(type) {
    var parentState = this.state;
    if (this.currentSession.sessionDescriptionHandler.peerConnection.getSenders) {
      this.currentSession.sessionDescriptionHandler.peerConnection.getSenders().forEach(function(sender) {
        if (sender.track) {
          if(sender.track.kind == "audio") {
            if(type == "audio" || type == "both") {
                parentState.isAudioMuted = !parentState.isAudioMuted;
                sender.track.enabled = !parentState.isAudioMuted;
            }
          }
          if(sender.track.kind == "video") {
            if(type == "video" || type == "both") {
              parentState.isVideoMuted = !parentState.isVideoMuted;
              sender.track.enabled = !parentState.isVideoMuted;
            }
          }
        }

      });
    }
    else {
      this.currentSession.sessionDescriptionHandler.peerConnection.getLocalStreams().forEach(function(stream) {
        if(type == "audio" || type == "both") {
          parentState.isAudioMuted = !parentState.isAudioMuted;
          stream.getAudioTracks().forEach(function(track) {
            track.enabled = !parentState.isAudioMuted;
          });
        }
        if(type == "video" || type == "both") {
          parentState.isVideoMuted = !parentState.isVideoMuted;
          stream.getVideoTracks().forEach(function(track) {
            track.enabled = !parentState.isVideoMuted;
          });
        }
      });
    }
  }
  replaceAudioVideoTrack(audioSourceId, videoSourceId) {
    console.log("Updating Audio Video Tracks")
    var parent = this;
    var wasRecording = false;
    //this.state.isScreenSharing = true;
    //var option = {video: {mediaSource: 'screen'}, audio: true};
    const constraints = {
      audio: {deviceId: audioSourceId ? {exact: audioSourceId} : true},
      video: {deviceId: videoSourceId ? {exact: videoSourceId} : undefined, width: 1280, height: 720}
    };
    console.log(constraints)
    if(navigator.mediaDevices) {
      if(parent.localStream) {
        console.log("stopping existing streams")
        parent.localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      if(this.state.isRecording) {
        wasRecording = true;
      }
      navigator.mediaDevices.getUserMedia(constraints)
      .then(function(streams){
        console.log("adding stream in replaceAudioTrack")
        allMediaStreams.push(streams);
        var videoTrack = streams.getVideoTracks()[0];
        var sender = parent.currentSession.sessionDescriptionHandler.peerConnection.getSenders().find(function(s) {
          return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
        parent.senderStatsTrack = videoTrack;

        var audioTrack = streams.getAudioTracks()[0];
        var sender = parent.currentSession.sessionDescriptionHandler.peerConnection.getSenders().find(function(s) {
          return s.track.kind == audioTrack.kind;
        });
        sender.replaceTrack(audioTrack);

        if(parent.localStream) {
          var localAudio = parent.localStream.getAudioTracks();
          if(localAudio) {
            if (localAudio.length > 0) {
              parent.localStream.removeTrack(localAudio[0]);
            }
          }

          var localVideo = parent.localStream.getVideoTracks();
          if(localVideo) {
            if (localVideo.length > 0) {
              parent.localStream.removeTrack(localVideo[0]);
            }
          }

          parent.localStream.addTrack(videoTrack);
          parent.localStream.addTrack(audioTrack);

        }
        if(wasRecording) {
          console.log("restarting local recording")
          parent.startLocalRecording()
        }
        parent.restartStatInterval()

      }, function(error){
       console.log("error ", error);
      });
    }
  }

  startScreenShare() {
    var parent = this;
    this.setState({"isScreenSharing": true})
    //this.state.isScreenSharing = true;
    var option = {video: {mediaSource: 'screen', maxWidth: 1280, maxHeight: 720}, audio: true};
    if(navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia(option)
      .then(function(streams){
        parent.screenshareStream = streams;
        var videoTrack = streams.getVideoTracks()[0];
        var sender = parent.currentSession.sessionDescriptionHandler.peerConnection.getSenders().find(function(s) {
          console.log("sender track")
          console.log(s)          
          return !s.track || s.track && s.track.kind == videoTrack.kind;
        });
        console.log('sender')
        console.log(sender)
        sender.replaceTrack(videoTrack);          
        parent.senderStatsTrack = videoTrack;
        parent.restartStatInterval()

        /*
        // may need something like this for local recording
        if(parent.localStream) {
          var localVideo = parent.localStream.getVideoTracks();
          if(localVideo) {
            if (localVideo.length > 0) {
              parent.localStream.removeTrack(localVideo[0]);
            }
          }
          parent.localStream.addTrack(videoTrack);
        }
        */

        parent.props.toggleScreenshareCallback(true)
      }, function(error){
        console.log("error ", error);
        parent.props.toggleScreenshareCallback(false)
      });
    }
  }

  stopScreenShare() {
    var parent = this;
    //this.state.isScreenSharing = false;
    this.setState({"isScreenSharing": false})
    if(navigator.mediaDevices) {
      if(parent.screenshareStream) {
        console.log("stopping screenshare streams")
        parent.screenshareStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      //var option = {video: true, audio: true};
      //navigator.mediaDevices.getUserMedia(option)
      //.then(function(streams){
      var streams = parent.localStream;
       var videoTrack = streams.getVideoTracks()[0];
       var sender = parent.currentSession.sessionDescriptionHandler.peerConnection.getSenders().find(function(s) {
         //return s.track.kind == videoTrack.kind;
          return !s.track || s.track && s.track.kind == "video";
       });
       sender.replaceTrack(videoTrack);
       parent.senderStatsTrack = videoTrack;
       parent.restartStatInterval()
       parent.props.toggleScreenshareCallback(false)
      //}, function(error){
      // console.log("error ", error);
      // parent.props.toggleScreenshareCallback(false)
      //});
    }
  }


  getHeaderValue(header) {
    if(this.req) {
      return  this.req.getHeader(header);
    }
  }

  incomingCall(session) {
    this.setState({callState:"Alerting"});

    if(this.props.onConnecting) {
      console.log("invoking onConnecting callback");
      this.props.onConnecting(this, session);
    }


    var remoteVideo = document.getElementById(this.state.remoteVideo);
    /*
    if(this.state.alertVideoUrl) {
      remoteVideo.src = this.state.alertVideoUrl;
    }


    remoteVideo.setAttribute("loop",true);
    remoteVideo.play();
    */

    this.handleCall(session);

    var req = session.request;
    this.req = req;
    var encodedMeta = req.getHeader("X-MetaData");
    if(encodedMeta) {
      try {
        this.setState({receivedMeta:JSON.parse(decodeURIComponent(encodedMeta))});
      } catch(e) {
        console.warn("Could not parse meta data header");
      }
    }

    if(this.props.autoAnswer) {
      console.log("Auto answering");
      this.answerCall();
      return;
    }
    if(this.props.onRinging) {
      console.log("invoking onRinging callback");
      this.props.onRinging(this, session);
    }
    return;
  }

  register() {
    var registerOptions = {};
    registerOptions.extraHeaders = [];
    if(this.state.jwtAuth) {
      registerOptions.extraHeaders.push("X-JWTAuth:"+this.state.jwtAuth);
    }

    this.sipUa.register(registerOptions);


  }

  placeCall() {
    var parent = this;
    this.setState({callState:"Calling", error:""});
    var inviteOptions = {};
    inviteOptions.extraHeaders = [];
    if(this.state.metaData) {
      var encodedMeta = encodeURIComponent(JSON.stringify(this.state.metaData));
      inviteOptions.extraHeaders.push("X-MetaData:"+encodedMeta);
    }

    if(this.state.jwtAuth) {
      inviteOptions.extraHeaders.push("X-JWTAuth:"+this.state.jwtAuth);
    }
    if(this.state.campaignId) {
      inviteOptions.extraHeaders.push("X-ForceCampaignId:"+this.state.campaignId);
    }
    inviteOptions.sessionDescriptionHandlerOptions = {
      /*
      RTCOfferOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: true
      },
      */
      constraints: {
        audio: true,
        video: (this.state.video) ? videoResolutionConstraints : this.state.video
        //video: videoResolutionConstraints
        //video: {mediaSource: 'screen'}
      }
    }
    if(this.state.video && !inviteOptions.sessionDescriptionHandlerOptions.constraints.video) {
      inviteOptions.sessionDescriptionHandlerOptions.RTCOfferOptions = {
        offerToReceiveVideo: true
      }
    }
    var myModifier = function(description) {
      if(parent.state.removeCodecs) {
        var codecs = parent.state.removeCodecs.split(",")
        for(var codecIn in codecs) {
          console.log("removing codec from offer: "+codecs[codecIn])
          description.sdp = parent.removeCodec(description.sdp, codecs[codecIn])
        }
      }
      return Promise.resolve(description);
    };
    var session = this.sipUa.invite(this.state.destination, inviteOptions, [myModifier]);
    this.handleCall(session);    
  }

  removeCodec(sdp, codecName) {
      const lines = sdp.split('\r\n');
      let codecPayloadType = null;

      // First, identify the payload type for the specified codec.
      for (const line of lines) {
          const rtpmapMatch = line.match(new RegExp(`a=rtpmap:(\\d+) ${codecName}\\/`, 'i'));
          if (rtpmapMatch) {
              codecPayloadType = rtpmapMatch[1];
              break;
          }
      }

      if (codecPayloadType) {
          let mAudioLineProcessed = false;
          const processedLines = lines.map(line => {
              // Special handling for the m=audio line
              if (line.startsWith('m=audio ') && !mAudioLineProcessed) {
                  mAudioLineProcessed = true; // Ensure we only process the m=audio line once
                  const parts = line.split(' ');
                  // The first three parts are "m=audio", port, and protocol, which should be preserved
                  const mAudioHeader = parts.slice(0, 3);
                  const codecList = parts.slice(3);
                  // Remove only the codec payload type from the list of codecs
                  const filteredCodecList = codecList.filter(part => part !== codecPayloadType);
                  return [...mAudioHeader, ...filteredCodecList].join(' ');
              } else if (line.includes(`a=rtpmap:${codecPayloadType} `) || line.includes(`a=fmtp:${codecPayloadType}`) || line.includes(`a=rtcp-fb:${codecPayloadType}`)) {
                  // Remove lines defining the codec being removed
                  return null;
              }
              return line; // Preserve all other lines
          }).filter(line => line !== null); // Remove null entries (lines marked for removal)

          return processedLines.join('\r\n');
      } else {
          // Codec was not found, return the original SDP unchanged.
          return sdp;
      }
  }

  reinvite() {
    var parent = this;
    console.log("reinviting")
    //this.setState({callState:"Calling", error:""});
    var inviteOptions = {};
    inviteOptions.extraHeaders = [];
    inviteOptions.sessionDescriptionHandlerOptions = {      
      /*
      RTCOfferOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: (this.state.video) ? true : false,
        iceRestart: true
      },
      */
      constraints: {
        audio: true,
        video: (this.state.video) ? videoResolutionConstraints : this.state.video
        //video: {mediaSource: 'screen'}
      }
    }
    var myModifier = function(description) {
      if(parent.state.removeCodecs) {
        var codecs = parent.state.removeCodecs.split(",")
        for(var codecIn in codecs) {
          console.log("removing codec from offer: "+codecs[codecIn])
          description.sdp = parent.removeCodec(description.sdp, codecs[codecIn])
        }
      }
      return Promise.resolve(description);
    };
    var session = this.currentSession.reinvite(inviteOptions, [myModifier]);
    //this.handleCall(session);
  }


  callConnected() {


    console.log("callConnected");


    var remoteStream = this.remoteStream;
    if(this.remoteStream) {
      setTimeout(function() {
        try {
          try {
            var remoteVideo = document.getElementById(this.state.remoteVideo);
          }
          catch(e) {
            var remoteVideo = document.getElementById("remoteVideo");
          }

          remoteVideo.srcObject = remoteStream;
          remoteVideo.play().catch(()=>{});
          // eslint-disable-next-line
        } catch (e) {
          console.log("problem playing remote video")
          console.log(e)
          console.log(remoteVideo)
        }
      }, 1000)
    }

  }

  /*
  * Local Recording
  */

  checkCodecsSupported() {
    let options = {mimeType: 'video/mp4'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(`${options.mimeType} is not supported`);
      options = {mimeType: 'video/webm;codecs=vp8,opus'};      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(`${options.mimeType} is not supported`);
        options = {mimeType: 'video/webm'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(`${options.mimeType} is not supported`);
          options = {mimeType: ''};
        }
      }
    }
    console.log("Recording codecs!")
    console.log(options)
    return options;
  }

  /*
  downloadLocalRecording() {
      var blob = new Blob(recordingData, {type: recordingData[0].type});
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'recording.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 100);
  }
  */

  startLocalRecording() {
    console.log("Starting local recording")
    const options = this.checkCodecsSupported();
    if(this.localStream) {
      const MIN_BLOB_SIZE = 5 * 1024 * 1024;
      var partSize = 0;
      var parts = [];
      this.recorder = new MediaRecorder(this.localStream, options);
      this.localRecordingStart = Math.floor(new Date().getTime() / 1000);
      this.localRecordingStop = null;
      var parent = this;
      var firstChunk = true;

      this.recorder.ondataavailable = e => {
        console.log("on recording data")
        if (e.data && e.data.size > 0) {
          //recordingData.push(e.data);
          //console.log(recordingData)
          const blob = e.data;
          partSize += blob.size;
          parts.push(blob);
          var final = (!parent.state.isRecording || parent.recorder.state == "inactive") ? true : false
          if (partSize > MIN_BLOB_SIZE || final) {
            let bigBlob = new Blob(parts, { type: blob.type });
            partSize = 0;
            parts = [];
            var reader = new FileReader();
            //reader.readAsArrayBuffer(e.data);
            reader.readAsDataURL(bigBlob);
            reader.onloadend = async function(event) {
              let base64Data = reader.result;
              //console.log(base64Data)
              //let uint8View = new Uint8Array(arrayBuffer);
              //console.log("recorder in onloadend")
              //console.log(parent.recorder)
              if(!parent.localRecordingStop) {
                parent.localRecordingStop = Math.floor(new Date().getTime() / 1000);  
              }
              var resultDict = {
                first: firstChunk,
                uploaded: false,
                recordingStart: parent.localRecordingStart,
                recordingStop: parent.localRecordingStop,
                final: final,
                chunk: base64Data,
                mimeType: options.mimeType
              }
              firstChunk = false;
              //recordingStatus.push(resultDict)
              parent.props.recordingChunkCallback(resultDict)

              if(!parent.state.isRecording) {
                console.log("finalized recording")
                //parent.downloadLocalRecording()
                //recordingData = [];
                //console.log(recordingData)
              }
            }
          }
        }
      };

      this.recorder.onStop = () => {
        console.log("recording stopped")
        //console.log("this recorder in onStop")
        //console.log(parent.recorder)
        //this.localStream.getTracks().forEach(track => track.stop());
        parent.setState({"isRecording": false})
        parent.localRecordingStop = Math.floor(new Date().getTime() / 1000);
      };

      this.localStream.addEventListener('inactive', () => {
        console.log('Recording inactive');
        this.stopLocalRecording();
      });
      this.setState({"isRecording": true})
      this.setState({"isRecordingUploading": true})
      this.recorder.start(15000);
      console.log("started recording");
    }
    else {
      console.log("No local stream to record!")
    }
  }
  stopLocalRecording() {
    console.log("Stopping local recording")
    this.setState({"isRecording": false})
    try {
      this.recorder.stop();
      //console.log("this recorder")
      //console.log(this.recorder)
    }
    catch(e) {
      console.log("Recording already stopped")
    }
    
    //recordingData = [];
  }

  render() {
    return (
      <div className="vida-webrtc-agent-sip"></div>
    );
  }

}

WebRTCClient.propTypes = {
  sipUser: PropTypes.string.isRequired,
  sipDomain: PropTypes.string.isRequired,
  sipServer: PropTypes.string,
  metaData: PropTypes.object,
  sipPassword: PropTypes.string.isRequired,
  video: PropTypes.bool,
  autoRegister: PropTypes.bool,
  autoConnect: PropTypes.bool,
  destination: PropTypes.string.isRequired,
  alertVideoUrl: PropTypes.string,
  ringbackVideoUrl: PropTypes.string,
  autoAnswer: PropTypes.bool,
  hangupCallNow: PropTypes.bool,
  answerCallNow: PropTypes.bool,
  rejectCallNow: PropTypes.bool,
  initiateCallNow: PropTypes.bool,
  reinviteCallNow: PropTypes.bool,
  toggleAudioNow: PropTypes.bool,
  toggleVideoNow: PropTypes.bool,
  toggleScreenshareNow: PropTypes.bool,
  toggleRecordingNow: PropTypes.bool,
  traceSip: PropTypes.bool,
  callLabel: PropTypes.string,
  remoteVideo: PropTypes.string,
  localVideo: PropTypes.string,
  jwtAuth: PropTypes.object,
  onConnected : PropTypes.func,
  onConnecting : PropTypes.func,
  onRinging : PropTypes.func,
  onDisconnected: PropTypes.func,
  onUploadBandwidth: PropTypes.func,
  onDownloadBandwidth: PropTypes.func,
  onHangup : PropTypes.func,
  mediaTested:PropTypes.bool,
  mediaSupported:PropTypes.bool,
  usingHttps: PropTypes.bool

};

export default WebRTCClient;
