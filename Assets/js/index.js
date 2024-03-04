let localStream;
let username;
let url = new URL(window.location.href);
    username = url.searchParams.get('username');
let peerConnection;    

let init= async ()=>{
    localStream= await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:true
    });
    document.getElementById("user2").srcObject=localStream
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
let createOffer=async()=>{

    peerConnection=new RTCPeerConnection(servers);
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offerSentToRemote",{
        username:username,
        remoteUser:remoteUser,
        offer:peerConnection.localDescription
    })
};