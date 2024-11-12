const express = require('express');
const path = require("path");
const app = express();
const indexRouter = require("./routes/indexRouter")

const http = require("http");
const socketIO = require("socket.io");
const { kMaxLength } = require('buffer');

const server = http.createServer(app);
const io = socketIO(server);

let waitingUsers = [];
let rooms = {
    
}

io.on("connection",function(socket){
    socket.on("joinroom", function(){
        if(waitingUsers.length>0){
            let partner = waitingUsers.shift();
            const roomname = `${socket.id}-${partner.id}`

            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit("joined",roomname);
        }
        else{
            waitingUsers.push(socket);
        }
    })

    socket.on("signalingMessage",function(data){
        socket.broadcast.to(data.room).emit("signalingMessage",data.message);
    })

    socket.on("message",function(data){
        socket.broadcast.to(data.room).emit("message",data.message);
    })

    socket.on("startVideoCall",function({room}){
        socket.broadcast.to(room).emit("incomingCall")
    })

    socket.on("acceptCall",function({room}){
        socket.broadcast.to(room).emit("callAccepted");
    })

    socket.on("rejectCall",function({room}){
        socket.broadcast.to(room).emit("callRejected");
    })

    socket.on("disconnect",function(){
        let index = waitingUsers.findIndex((waitingUsers) => waitingUsers.id === socket.id);

        waitingUsers.splice(index,1);
    })
})

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));


app.use("/", indexRouter);

server.listen(process.env.PORT || 5000);