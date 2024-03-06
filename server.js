const express = require("express");
const path = require("path");
const { use } = require("./Server/routes/router");
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
    allowEIO3:true 
});

var userConnection = [];

io.on("connection",(socket)=>{
    console.log("This is Socket ID: ",socket.id);
    
    socket.on("userconnect",(data)=>{
    console.log("Login UsersName:", data.displayName);
        userConnection.push({
            connectionId: socket.id,
            user_id: data.displayName,
        });
        var userCount=userConnection.length;
        console.log("UserCount",userCount);
        
    });


    socket.on("offerSentToRemote",(data)=>{
    var offerReceiver=userConnection.find((o)=>o.user_id===data.remoteUser);
      
    if(offerReceiver){
        console.log("OfferReceiver user :",offerReceiver.connectionId);
        socket.to(offerReceiver.connectionId).emit("ReceiveOffer",data);
    }
    });


    socket.on("answerSentToUser1",(data)=>{
        var answerReceiver=userConnection.find((o)=>o.user_id===data.receiver)

        if(answerReceiver){
            console.log("answerReceiver user :",answerReceiver.connectionId);
            socket.to(answerReceiver.connectionId).emit("ReceiveAnswer",data);
        }
    });
    
    socket.on("candidateSentToUser",(data)=>{
        var candidateReceiver=userConnection.find((o)=>o.user_id===data.remoteUser)

        if(candidateReceiver){
            console.log("candidateReceiver user :",candidateReceiver.connectionId);
            socket.to(candidateReceiver.connectionId).emit("candidateReceiver",data);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
        var disUser=userConnection.find((p)=>p.connectionId=socket.id);
        if(disUser){
            userConnection=userConnection.filter((p)=>p.connectionId=!socket.id);
            console.log("Rest usernames are:",userConnection.map(function(user){
               return user.user_id;
            }))
        }
      });
});
