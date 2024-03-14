let localStream;
var username;
let remoteUser;
let url = new URL(window.location.href);
// // username = url.searchParams.get("username");
// remoteUser = url.searchParams.get("remoteuser");
let peerConnection;
let remoteStream;
let sendChannel;
let receiveChannel;
var msgInput = document.querySelector("#msg-input");
var msgSendBtn = document.querySelector(".msg-send-button");
var chatTextArea = document.querySelector(".chat-text-area");
var omeID = localStorage.getItem("omeID");
if (omeID) {
  $.ajax({
    url: "/new-user-update/" + omeID + "",
    type: "PUT",
    success: function (data) {
      const newOmeID = data.omeID;
      if (newOmeID) {
        localStorage.removeItem("omeID");
        localStorage.setItem("omeID", newOmeID);
        username = newOmeID;
        console.log("Here username is: ", username);
        runUser();
      } else {
        username = omeID;
        console.log("Here username is: ", username);
        runUser();
      }
    },
  });
  console.log("Here username is: ", username);
} else {
  var postData = "Demo Data";
  $.ajax({
    type: "POST",
    url: "/api/users",
    data: postData,
    success: function (response) {
      console.log(response);
      localStorage.setItem("omeID", response);
      username = response;
      runUser();
    },
    error: function (error) {
      console.log(error);
    },
  });
}

document.getElementById("deleteButton").addEventListener("click", () => {
  fetch("/deleteAllRecords", {
    method: "DELETE",
  })
    .then((response) => response.text())
    .then((message) => {
      console.log(message);
    })
    .catch((error) => console.error("Error deleting records:", error));
});
function runUser() {
  let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    document.getElementById("user-1").srcObject = localStream;
    $.post("/get-remote-users", { omeID: username })
      .done(function (data) {
        console.log(data);
        if (data[0]) {
          if (data[0]._id == remoteUser || data[0]._id == username) {
          } else {
            remoteUser = data[0]._id;
            createOffer(data[0]._id);
          }
        }
      })
      .fail(function (xhr, textStatus, errorThrown) {
        console.log(xhr.responseText);
      });
  };
  init();
  let socket = io.connect();
  socket.on("connect", () => {
    if (socket.connected) {
      socket.emit("userconnect", {
        displayName: username,
      });
    }
  });
  let servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.1.google.com:19302",
          "stun:stun2.1.google.com:19302",
        ],
      },
    ],
  };
  let createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    document.getElementById("user-2").srcObject = remoteStream;
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
    peerConnection.ontrack = async (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
    remoteStream.oninactive = () => {
      remoteStream.getTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      peerConnection.close();
    };
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        socket.emit("candidateSentToUser", {
          username: username,
          remoteUser: remoteUser,
          iceCandidateData: event.candidate,
        });
      }
    };
    sendChannel = peerConnection.createDataChannel("sendDataChannel");
    sendChannel.onopen = () => {
      console.log("Data channel is now open and ready to use");
      onSendChannelStateChange();
    };

    peerConnection.ondatachannel = receiveChannelCallback;
    // sendChannel.onmessage=onSendChannelMessageCallBack;
  };
  function sendData() {
    const msgData = msgInput.value;
    chatTextArea.innerHTML +=
      "<div style='margin-top:2px; margin-bottom:2px;'><b>Me: </b>" +
      msgData +
      "</div>";
    if (sendChannel) {
      onSendChannelStateChange();
      sendChannel.send(msgData);
      msgInput.value = "";
    } else {
      receiveChannel.send(msgData);
      msgInput.value = "";
    }
  }
  function receiveChannelCallback(event) {
    console.log("Receive Channel Callback");
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveChannelMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
  }
  function onReceiveChannelMessageCallback(event) {
    console.log("Received Message");
    chatTextArea.innerHTML +=
      "<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger: </b>" +
      event.data +
      "</div>";
  }
  function onReceiveChannelStateChange() {
    const readystate = receiveChannel.readystate;
    console.log("Receive channel state is: " + readystate);
    if (readystate === "open") {
      console.log(
        "Data channel ready state is open - onReceiveChannelStateChange"
      );
    } else {
      console.log(
        "Data channel ready state is NOT open - onReceiveChannelStateChange"
      );
    }
  }
  function onSendChannelStateChange() {
    const readystate = sendChannel.readystate;
    console.log("Send channel state is: " + readystate);
    if (readystate === "open") {
      console.log(
        "Data channel ready state is open - onSendChannelStateChange"
      );
    } else {
      console.log(
        "Data channel ready state is NOT open - onSendChannelStateChange"
      );
    }
  }
  function fetchNextUser(remoteUser) {
    $.post(
      "https://amooglev2.vercel.app//get-next-user",
      { omeID: username, remoteUser: remoteUser },
      function (data) {
        console.log("Next user is: ", data);
        if (data[0]) {
          if (data[0]._id == remoteUser || data[0]._id == username) {
          } else {
            remoteUser = data[0]._id;
            createOffer(data[0]._id);
          }
        }
      }
    );
  }
  let createOffer = async (remoteU) => {
    createPeerConnection();
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offerSentToRemote", {
      username: username,
      remoteUser: remoteU,
      offer: peerConnection.localDescription,
    });
  };

  let createAnswer = async (data) => {
    remoteUser = data.username;
    createPeerConnection();
    await peerConnection.setRemoteDescription(data.offer);
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answerSentToUser1", {
      answer: answer,
      sender: data.remoteUser,
      receiver: data.username,
    });
    document.querySelector(".next-chat").style.pointerEvents = "auto";
    $.ajax({
      url: "/update-on-engagement/" + username + "",
      type: "PUT",
      success: function (response) {},
    });
  };
  socket.on("ReceiveOffer", function (data) {
    createAnswer(data);
  });
  let addAnswer = async (data) => {
    if (!peerConnection.currentRemoteDescription) {
      peerConnection.setRemoteDescription(data.answer);
    }
    document.querySelector(".next-chat").style.pointerEvents = "auto";
    $.ajax({
      url: "/update-on-engagement/" + username + "",
      type: "PUT",
      success: function (response) {},
    });
  };
  socket.on("ReceiveAnswer", function (data) {
    addAnswer(data);
  });
  socket.on("closedRemoteUser", function (data) {
    const remotStream = peerConnection.getRemoteStreams()[0];
    remotStream.getTracks().forEach((track) => track.stop());
    peerConnection.close();
    document.querySelector(".chat-text-area").innerHTML = "";
    const remoteVid = document.getElementById("user-2");
    if (remoteVid.srcObject) {
      remoteVid.srcObject.getTracks().forEach((track) => track.stop());
      remoteVid.srcObject = null;
    }
    console.log("Closed Remote user");
    $.ajax({
      url: "/update-on-next/" + username + "",
      type: "PUT",
      success: function (response) {
        fetchNextUser(remoteUser);
      },
    });
  });

  socket.on("candidateReceiver", function (data) {
    peerConnection.addIceCandidate(data.iceCandidateData);
  });

  msgSendBtn.addEventListener("click", function (event) {
    sendData();
  });

  window.addEventListener("unload", function (event) {
    socket.emit("remoteUserClosed", {
      username: username,
      remoteUser: remoteUser,
    });
    if (navigator.userAgent.indexOf("Chrome") != -1) {
      $.ajax({
        url: "/leaving-user-update/" + username + "",
        type: "PUT",
        success: function (response) {
          console.log(response);
        },
      });
      $.ajax({
        url: "/update-on-otheruser-closing/" + remoteUser + "",
        type: "PUT",
        success: function (response) {
          console.log(response);
        },
      });
    } else if (navigator.userAgent.indexOf("Firefox") != -1) {
      $.ajax({
        url: "/leaving-user-update/" + username + "",
        type: "PUT",
        async: false,
        success: function (response) {
          console.log(response);
        },
      });

      $.ajax({
        url: "/update-on-otheruser-closing/" + remoteUser + "",
        type: "PUT",
        async: false,
        success: function (response) {
          console.log(response);
        },
      });
    } else {
      console.log("This is not Chrome or Firefox");
    }
  });
  async function closeConnection() {
    document.querySelector(".chat-text-area").innerHTML = "";
    const remotStream = peerConnection.getRemoteStreams()[0];
    remotStream.getTracks().forEach((track) => track.stop());

    await peerConnection.close();
    const remoteVid = document.getElementById("user-2");
    if (remoteVid.srcObject) {
      remoteVid.srcObject.getTracks().forEach((track) => track.stop());
      remoteVid.srcObject = null;
    }

    await socket.emit("remoteUserClosed", {
      username: username,
      remoteUser: remoteUser,
    });
    $.ajax({
      url: "/update-on-next/" + username + "",
      type: "PUT",
      success: function (response) {
        fetchNextUser(remoteUser);
      },
    });
  }

  $(document).on("click", ".next-chat", function () {
    document.querySelector(".chat-text-area").innerHTML = "";
    console.log("From Next Chat button");
    closeConnection();
  });
}
