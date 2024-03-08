let localStream;
let username;
let remoteUser;
let url = new URL(window.location.href);

username = url.searchParams.get("username");
remoteUser = url.searchParams.get("remoteUser");

let peerConnection; 
let remoteStream;
let sendChannel;
let receiveChannel;

var msgInput=document.querySelector("#msg-input")
var msgSendBtn=document.querySelector(".msg-send-button")
var chatTextArea=document.querySelector(".chat-text-area")


let init= async ()=>{
    localStream= await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:true
    });
    document.getElementById("user-1").srcObject=localStream;
    createOffer()
};
init();

let socket = io.connect();
socket.on("connect",()=>{
    if (socket.connected) {
        socket.emit("userconnect",{
            displayName:username,
        });
    }
});

let servers={
    iceServers:[
       {
        urls:["stun:stun1.1.google.com:19302","stun:stun2.1.google.com:19302"],
       },
    ],
};

let createPeerConnection=async()=>{
    peerConnection=new RTCPeerConnection(servers);

    remoteStream=new MediaStream();
    document.getElementById("user-2").srcObject=remoteStream;

    localStream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track,localStream)
    })

    peerConnection.ontrack=async(event)=>{
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track)
        })
    }

    remoteStream.oninactive=()=>{
        remoteStream.getTracks().forEach((track)=>{
            track.enabled=!track.enabled
        })
        peerConnection.close();
    }

    peerConnection.onicecandidate=async(event)=>{
        if(event.candidate){
            socket.emit("candidateSentToUser",{
                username:username,
                remoteUser:remoteUser,
                iceCandidateData:event.candidate
            })
        }
    }
    sendChannel=peerConnection.createDataChannel("sendDataChannel")
    sendChannel.onopen=()=>{
        console.log("Data Channel is open & ready to use")
        onSendChannelStateChange();
    }
    peerConnection.ondatachannel=receiveChannelCallback;
    //sendChannel.onmessage=onSendChannelMessageCallBack;


}

function sendData(){
    const msgData=msgInput.value;
    chatTextArea.innerHTML+="<div style='margin-top:2px; margin-bottom:2px;'><b>Me:</b>"+msgData+"</div>";
    if(sendChannel){
        onSendChannelStateChange();
        sendChannel.send(msgData);
        msgInput.value=""
    }
    else{
        receiveChannel.send(msgData);
        msgInput.value=""
    }

}

function receiveChannelCallback(event){
    console.log("Receive Channel Callback");
    receiveChannel=event.channel;
    receiveChannel.onmessage=onReceiveChannelMessageCallback;
    receiveChannel.onopen=onReceiveChannelStateChange;
    receiveChannel.onclose=onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallback(event){
    console.log("Received Message")
    chatTextArea.innerHTML+="<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger:</b>"+event.data+"</div>"
}

function onReceiveChannelStateChange(){
    const readystate=receiveChannel.readystate;
    console.log("Receive channel state is-"+readystate)
    if(readystate==="open"){
        console.log("Data channel ready state is open - onReceiveChannelStateChange")
    }
    else{
        console.log("Data channel ready state is close - onReceiveChannelStateChange")
    }
}

function onSendChannelStateChange(){
    const readystate=sendChannel.readystate;
    console.log("Send channel state is-"+readystate)
    if(readystate==="open"){
        console.log("Data channel ready state is open - onSendChannelStateChange")
    }
    else{
        console.log("Data channel ready state is close - onSendChannelStateChange")
    }
}

let createOffer=async()=>{

    createPeerConnection()
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offerSentToRemote",{
        username:username,
        remoteUser:remoteUser,
        offer:peerConnection.localDescription,
    })
};
let createAnswer=async(data)=>{
    remoteUser=data.username

    createPeerConnection()
    await peerConnection.setRemoteDescription(data.offer);
    let answer=await peerConnection.createAnswer();
    
    await peerConnection.setLocalDescription(answer);

    socket.emit("answerSentToUser1",{
        answer:answer,
        sender: data.remoteUser,
        receiver: data.username,
    });
}
socket.on("ReceiveOffer",function(data){
    createAnswer(data)
})

let addAnswer=async(data)=>{
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(data.answer);
    }
}

socket.on("ReceiveAnswer",function(data){
    addAnswer(data)
})

socket.on("candidateReceiver",function(data){
    peerConnection.addIceCandidate(data.iceCandidateData);
})

msgSendBtn.addEventListener("click",function(event){
    sendData();
})