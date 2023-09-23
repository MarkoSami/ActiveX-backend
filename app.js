const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cloudinaryLib = require("./lib/cloudinary_CDN_lib");
const cors = require("cors");
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const utils = require('./lib/utils');
require('dotenv').config();
const {getio,init} = require('./bin/sockets');
const Notification = require('./models/Notification');

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");
const mongoLib = require("./lib/mongoDBLib");
const feedRouter = require("./routes/feed");
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');
const {authenticate} = require('./authentication/authenticate')
const commentRouter = require('./routes/comments');
const { errorHandler } = require("./lib/errorHandler");
const { log, error, Console } = require("console");
const ytdl = require('ytdl-core');


// const { authenticate } = require('./authentication/authenticate');
const port = process.env.PORT || '8000';

mongoLib.connectToMongo().then(() => { });

const app = express();
cloudinaryLib.configCloudinary();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.use(express.static('dist'));


app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:8000'], 
  credentials: true
}));
// app.use("/", indexRouter);
// app.use("/upload", async (req, res, next) => {
//   const result = await cloudinaryLib.uploadImage("img.png");
//   res.send({ imgId: result });
// });
 


// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.json(err);
// });

app.set(port);
let server = http.createServer(app);


// establish socketIO server
const io = init(server);
app.locals.io = io;
// console.log(io);

// Store room information 
let RandomOneToOneRooms = [];// rooms which are available to join randomly between 2 persons

let oneToOneRoom = [];//private room bwtewwn 2 persons

let RandomGroupRooms = [];//rooms which are available to join randomly between 2 or more persons

let GroupRooms = {};//private rooms between 2 or more persons

let connectedUsers_IDtoUserName = {} // socket ids mapped to their usernames
let connectedUsers_UserNametoId = {} // socket usernames mapped to their ids
let connectedUsers_IDtoRoomId = {}
app.locals.connectedUsers_IDtoUserName = connectedUsers_IDtoUserName;
app.locals.connectedUsers_UserNametoId = connectedUsers_UserNametoId;

app.use("/login",loginRouter,errorHandler);
app.use("/signup",signupRouter,errorHandler);

// app.use(authenticate);
app.use("/users", usersRouter,errorHandler);
app.use("/posts" ,postsRouter,errorHandler);
app.use("/comments" ,commentRouter,errorHandler);
app.use("/feed",feedRouter,errorHandler);
app.use("/rooms",(req,res,next)=>{
  
  const rooms = [];
  for (const [roomID, videoData] of Object.entries(GroupRooms)) {
    rooms.push({ roomID, videoData });
  }

  res.json({rooms,count: rooms.length});

})

// app.get("/notifications",async (req,res,next)=>{
//   try{
//     const notifications = await  Notification.find({});
//     res.json(notifications);
//   }catch(err){
//     console.log(err);
//     next();
//   }
// })

// console.log(io.on);

io.on("connection", (socket) => {
  const userName = socket.handshake.query.userName;
  console.log('______________________________________________________________________\n');
  console.log(`User ${userName} with socket id: ${socket.id} connected to the server!`);
  console.log('______________________________________________________________________\n');
  connectedUsers_IDtoUserName[socket.id] = userName;
  connectedUsers_UserNametoId[userName] = socket.id;
  console.log(connectedUsers_UserNametoId);
  
  // join new room event 
  socket.on("join_random_room", async () => {
    let roomId;
    if (oneToOneRoom.length == 0) {
      roomId = uuidv4();
      oneToOneRoom.push(roomId)
    } else {
      let randomIndex = utils.getRandomNumber(0, oneToOneRoom.length - 1);
      roomId = oneToOneRoom[randomIndex];
      // oneToOneRoom.splice(randomIndex, 1);
    }
    socket.join(roomId);
    console.log('--->user joined random room ' + roomId);
    console.log("____________________________________");
    socket.emit('joined_random_room', roomId);

  });




  socket.on('create_room', () => {
    const roomID = uuidv4();
    GroupRooms[roomID] = {
      participants: [connectedUsers_IDtoUserName[socket.id]],
      owner: connectedUsers_IDtoUserName[socket.id]
    };
    connectedUsers_IDtoRoomId[socket.id] = roomID;
    console.log(`Rooms: ${GroupRooms[roomID].participants}, owner: ${GroupRooms[roomID].owner}`);
    console.log(`participants:`);
    for (const participant in GroupRooms[roomID].participants) {
      console.log(participant);
    }
    
    socket.join(roomID);
    io.emit('room_created', roomID);
    console.log(`User created and joined a new  room , room ID : ${roomID}`);
    console.log("____________________________________");
  })


  socket.on('join_room', (roomId) => {
    if(!GroupRooms[roomId]){
      console.log(`Can't connect to this room, it may be closed!`);
      return;
    }
    
    if(GroupRooms[roomId].participants.includes(connectedUsers_IDtoUserName[socket.id])){
      console.log('user is already connected to this room ');
      return;
    }
    socket.join(roomId);
    connectedUsers_IDtoRoomId[socket.id] = roomId;
    GroupRooms[roomId].participants.push(connectedUsers_IDtoUserName[socket.id]);
    socket.broadcast.to(roomId).emit('userJoined', socket.id);
    console.log(`User ${socket.id} joined room , room ID: ${roomId}`);
    console.log(`${GroupRooms[roomId].participants.length} participants:`);
    console.log(GroupRooms[roomId].participants);
  })

  socket.on('shareVideoDetails',(data)=>{
    console.log(`sharing data`);
    io.to(data.userID).emit("video_ready_to", data.videoURL);
    io.to(data.userID).emit("video_started_to", data.currentTime);
    console.log(`Modified new user video time  to ${data.currentTime}`);
  })

  socket.on("video_started", (data) => {
    socket.to(data.roomId).emit("video_started_to", (data.currentTime));
    console.log("video_started_to_client" + data.roomId);
    console.log("____________________________________");
  });


  socket.on("video_paused", (roomId) => {
    socket.to(roomId).emit("video_paused_to");
    console.log("video_paused_to_client" + roomId);
    console.log("____________________________________");
  });


  socket.on("video_ready", async(data) => {
    console.log(data);

    const info = await ytdl.getInfo(data.video_URL);

    try{
      const  videoData = {
        videoURL: data.video_URL,
        Title: info.videoDetails.title,
        ThumbnailURL: info.player_response.videoDetails.thumbnail.thumbnails.pop().url,
      }
      GroupRooms[data.roomId] = videoData;

    }catch(err){
      console.log(error);
    }
    

    console.log(GroupRooms[data.roomId]);

    socket.to(data.roomId).emit("video_ready_to", data.video_URL)
    console.log(`Video ready in room ${data.roomId} , URL ${data.video_URL}`);
    console.log("____________________________________");

  })



  socket.on("send_message", (data) => {
    data.messageData.userName = connectedUsers_IDtoUserName[socket.id];
    socket.to(data.messageData.room).emit("message_received", data.messageData);
    console.log(data);
    console.log(data.messageData);
    console.log(`Broadcasted a message to all the clients... message: ${data.messageData.message}. roomId ${data.messageData.room}`);
  });

  
  socket.on("load_feed", () => {
    // to do
  })
  socket.on("load_comments", () => {

  })

  socket.on("disconnect",()=>{

    const userName = connectedUsers_IDtoUserName[socket.id]; 
    console.log(`___________________________________\n`);
    console.log(`User ${userName} has disconnected!`);
    console.log(`___________________________________\n`);

    delete connectedUsers_IDtoUserName[socket.id];
    delete connectedUsers_UserNametoId[userName];

    // delete the user from the room when it disconnects and delete the room if it has become empty 
    const userRoom = GroupRooms[connectedUsers_IDtoRoomId[socket.id]];
    if( userRoom && !userRoom.participants.length){
      GroupRooms[socket.id].participants = userRoom.participant.splice(userRoom.participants.findIndex(connectedUsers_IDtoUserName[socket.id]),1);
      return;
    }
    
    delete GroupRooms[connectedUsers_IDtoRoomId[socket.id]];
    console.log(`room with id ${connectedUsers_IDtoRoomId[socket.id]} was deleted!`);
    
    

  })

});





/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', (err)=>{console.log(err)});
server.on('listening', ()=>{console.log(`Server is running on port ${port}`)});




module.exports = {server,connectedUsers_IDtoUserName,connectedUsers_UserNametoId};
