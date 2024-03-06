const express = require("express");
const path = require("path");
// const bodyparser = require("body-parser");
const PORT = process.env.PORT || 5000;
const app=express();

// app.use(bodyparser.urlencoded({express:true}));
// app.use(bodyparser.json());
app.use(express.urlencoded({extended: true})); 
app.use(express.json());   
app.set("view engine", "ejs");
app.use("/css", express.static(path.resolve(__dirname,"Assets/css")));
app.use("/img", express.static(path.resolve(__dirname,"Assets/img")));
app.use("/js", express.static(path.resolve(__dirname,"Assets/js")));

app.use("/",require("./Server/routes/router"));

var server=app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});

const io = require("socket.io")(server, {
    allowEIO3:true  //for avoiding mismatch issue,false by default
});

var userConnection = [];

io.on("connection",(socket)=>{
    console.log("This is Socket ID: ",socket.id);
    
    socket.on("userconnect",(data)=>{
    console.log("Login UsersName:", data.displayName);
        userConnection.push({
            connectionID: socket.id,
            user_id: data.displayName,
        });
        var userCount=userConnection.length;
        console.log("UserCount",userCount);
        
    });


    socket.on("offerSentToRemote",(data)=>{
    var offerReceiver=userConnection.find((o)=>o.user_id===data.remoteUser);
      
    if(offerReceiver){
        console.log("OfferReceiver user :",offerReceiver.connectionID);
        socket.to(offerReceiver.connectionID).emit("ReceiveOffer",data);
    }
    });


    socket.on("answerSentToUser1",(data)=>{
        var answerReceiver=userConnection.find((o)=>o.user_id===data.receiver)

        if(answerReceiver){
            console.log("answerReceiver user :",answerReceiver.connectionID);
            socket.to(answerReceiver.connectionID).emit("ReceiveAnswer",data);
        }
    });
    
    socket.on("candidateSentToUser",(data)=>{
        var candidateReceiver=userConnection.find((o)=>o.user_id===data.remoteUser)

        if(candidateReceiver){
            console.log("candidateReceiver user :",candidateReceiver.connectionID);
            socket.to(candidateReceiver.connectionID).emit("candidateReceiver",data);
        }
    });
    
});
