const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cloudinaryLib = require("./lib/cloudinary_CDN_lib");
const cors = require("cors");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const utils = require("./lib/utils");
require("dotenv").config();
const { getio, init } = require("./bin/sockets");
const Notification = require("./models/Notification");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");
const mongoLib = require("./lib/mongoDBLib");
const feedRouter = require("./routes/feed");
const loginRouter = require("./routes/login");
const signupRouter = require("./routes/signup");
const { authenticate } = require("./authentication/authenticate");
const commentRouter = require("./routes/comments");
const { errorHandler } = require("./lib/errorHandler");
const { log, error, Console } = require("console");
const ytdl = require("ytdl-core");


// const { authenticate } = require('./authentication/authenticate');
const port = process.env.PORT || "8000";

mongoLib.connectToMongo().then(() => {});

const app = express();
cloudinaryLib.configCloudinary();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.use(express.static("dist"));

app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://screenmates-uvjd.vercel.app",
      "http://localhost:8000",
      "http://localhost:4173",
      "https://screenmates-beta-vv.onrender.com",
    ],
    credentials: true,
  })
);

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
let RandomOneToOneRooms = []; // rooms which are available to join randomly between 2 persons

let oneToOneRoom = []; //private room bwtewwn 2 persons

let RandomGroupRooms = []; //rooms which are available to join randomly between 2 or more persons

let GroupRooms = {}; //private rooms between 2 or more persons

let connectedUsers_IDtoUserName = {}; // socket ids mapped to their usernames
let connectedUsers_UserNametoId = {}; // socket usernames mapped to their ids
let connectedUsers_IDtoRoomId = {};

class Room {
  constructor(owner) {
    this.participants = [];
    this.owner = owner;
    this.videoData = {};
  }
}



app.locals.connectedUsers_IDtoUserName = connectedUsers_IDtoUserName;
app.locals.connectedUsers_UserNametoId = connectedUsers_UserNametoId;


app.use("/login", loginRouter, errorHandler);
app.use("/signup", signupRouter, errorHandler);

// app.use(authenticate);
app.use("/users", usersRouter, errorHandler);
app.use("/posts", postsRouter, errorHandler);
app.use("/comments", commentRouter, errorHandler);
app.use("/feed", feedRouter, errorHandler);

app.use("/rooms", (req, res, next) => {
  const rooms = [];
  for (const [roomID, roomData] of Object.entries(GroupRooms)) {
    rooms.push({ roomID, roomData });
  }

  res.json({ rooms, count: rooms.length });
});




io.on("connection",async (socket) => {
  const userName = socket.handshake.query.userName;
  console.log(`===>user name wanted to connect ${userName}  ${connectedUsers_UserNametoId[userName] }, ${userName === null},${typeof(userName)}`);
  // checking if the user is already connected or the userName is incorrect or undefined
  if(connectedUsers_UserNametoId[userName] || userName === null){
    socket.disconnect();
    utils.logSocketEvent(`User has been prevented from connecting to ther server because ${userName? `He is already connected `: `username is not correct`}!`);
    return;
  }

  try{
    Notification.sendNotifications(socket);
  }catch(err){
    console.log(err);
    next();
  }
  // senfing unseen notification to the user
  
  // adding the user to the rooms records
  connectedUsers_IDtoUserName[socket.id] = userName;
  connectedUsers_UserNametoId[userName] = socket.id;
  console.log(connectedUsers_UserNametoId);
  
  utils.logSocketEvent(`User ${userName} with socket id: ${socket.id} connected to the server!`);

  // join new room event
  socket.on("join_random_room", async () => {
    let roomId;
    if (oneToOneRoom.length == 0) {
      roomId = uuidv4();
      oneToOneRoom.push(roomId);
    } else {
      let randomIndex = utils.getRandomNumber(0, oneToOneRoom.length - 1);
      roomId = oneToOneRoom[randomIndex];
      // oneToOneRoom.splice(randomIndex, 1);
    }
    socket.join(roomId);
    console.log("--->user joined random room " + roomId);
    console.log("____________________________________");
    socket.emit("joined_random_room", roomId);
  });

  socket.on("create_room", () => {
    const roomID = uuidv4();
    GroupRooms[roomID] = new Room(connectedUsers_IDtoUserName[socket.id]);

    connectedUsers_IDtoRoomId[socket.id] = roomID;

    console.log(
      `Rooms: ${GroupRooms[roomID].participants}, owner: ${GroupRooms[roomID].owner}`
    );
    console.log(`participants:`);
    for (const participant in GroupRooms[roomID].participants) {
      console.log(participant);
    }

    socket.join(roomID);
    io.emit("room_created", {roomID,owner: GroupRooms[roomID].owner});
    console.log(`User created and joined a new  room , room ID : ${roomID}`);
    console.log("____________________________________");
  });

  socket.on("join_room", (roomId) => {
    if (!GroupRooms[roomId]) {
      console.log(`Can't connect to th already room, it may be closed!`);
      return;
    }

    console.log(GroupRooms[roomId].participants);
    if (
      GroupRooms[roomId].participants.includes(
        connectedUsers_IDtoUserName[socket.id]
      )
    ) {
      console.log("user is already connected to this room ");
      socket.broadcast.to(roomId).emit("userJoined", {socketId: socket.id,owner: GroupRooms[roomId].owner});

      return;
    }
    socket.join(roomId);
    connectedUsers_IDtoRoomId[socket.id] = roomId;
    GroupRooms[roomId].participants.push(
      connectedUsers_IDtoUserName[socket.id]
    );
    socket.broadcast.to(roomId).emit("userJoined", {socketId: socket.id,owner: GroupRooms[roomId].owner});
    console.log(`User ${socket.id} joined room , room ID: ${roomId}`);
    console.log(`${GroupRooms[roomId].participants.length} participants:`);
    console.log(GroupRooms[roomId].participants);
  });

  socket.on("shareVideoDetails", (data) => {
    console.log(`sharing data`);
    io.to(data.userID).emit("video_ready_to", data.videoURL);
    // io.to(data.userID).emit("video_started_to", data.currentTime);
    console.log(`Modified new user video time  to ${data.currentTime}`);
  });

  socket.on("video_started", (data) => {
    if (
      GroupRooms[data.roomId] &&GroupRooms[data.roomId].owner !== connectedUsers_IDtoUserName[socket.id]
    ) {
      console.log(`User is unuthorized to take this action!`);
      io.to(socket.id).emit("setVideoTime",{videoTime: data.currentTime});
      utils.logSocketEvent(`Video Time was sent to user: ${connectedUsers_IDtoUserName[socket.id]}, with id: ${socket.id}`);
      return;
    }
    socket.to(data.roomId).emit("video_started_to", data.currentTime);
    utils.logSocketEvent("video_started_to_client" + data.roomId);
  });

  socket.on("video_paused", (roomId) => {
    if (GroupRooms[roomId] && GroupRooms[roomId].owner !== connectedUsers_IDtoUserName[socket.id]) {
      console.log(`User is unuthorized to take this action!`);
      return;
    }
    socket.to(roomId).emit("video_paused_to");
    console.log("video_paused_to_client" + roomId);
    console.log("____________________________________");
  });

  socket.on("video_ready", async (data) => {
    console.log(`===========>` + data.roomId);
    if (
      GroupRooms[data.roomId].owner !== connectedUsers_IDtoUserName[socket.id]
    ) {
      console.log(`User is unuthorized to take this action!`);
      return;
    }
    const info = await ytdl.getInfo(data.video_URL);

    try {
      const videoData = {
        videoURL: data.video_URL,
        Title: info.videoDetails.title,
        ThumbnailURL:
          info.player_response.videoDetails.thumbnail.thumbnails.pop().url,
      };
      GroupRooms[data.roomId].videoData = videoData;
    } catch (err) {
      console.log(error);
    }

    console.log(GroupRooms[data.roomId]);

    socket.to(data.roomId).emit("video_ready_to", data.video_URL);
    console.log(`Video ready in room ${data.roomId} , URL ${data.video_URL}`);
    console.log("____________________________________");
  });

  socket.on("send_message", (data) => {
    data.messageData.userName = connectedUsers_IDtoUserName[socket.id];
    socket.to(data.messageData.room).emit("message_received", data.messageData);
    console.log(data);
    console.log(data.messageData);
    console.log(
      `Broadcasted a message to all the clients... message: ${data.messageData.message}. roomId ${data.messageData.room}`
    );
  });

  socket.on("load_feed", () => {
    // to do
  });
  socket.on("load_comments", () => {});

  //__________________________________________
  // handles user disconnection

  socket.on("disconnect", () => {
    const userName = connectedUsers_IDtoUserName[socket.id]; // getting the user name of the user by its socket id
    utils.logSocketEvent(`User ${userName} has disconnected!`);
    const userRoomId = connectedUsers_IDtoRoomId[socket.id];

    // delete the user from the room when it disconnects and delete the room if it has become empty
    if (userRoomId) {
      // if the user is thw owner of the room choose another user in the room to be new owner or delete room
      if (GroupRooms[userRoomId].owner === userName) {
        // if the room  has no more participants than the user then delete
        if (!GroupRooms[userRoomId].participants.length) {
          delete GroupRooms[userRoomId];
          utils.logSocketEvent(
            `room with id ${connectedUsers_IDtoRoomId[socket.id]} was deleted!`
          );
        } else {
          // else make the owner
          GroupRooms[userRoomId].owner = GroupRooms[userRoomId].participants[0];
          GroupRooms[userRoomId].participants.splice(0, 1);
          io.to(userRoomId).emit('ownershiptransferred',{owner: GroupRooms[userRoomId].owner});
          utils.logSocketEvent(
            `Ownership of room: ${userRoomId} has been transferred ot user: ${GroupRooms[userRoomId].owner}! `
          );
        }
      }
      else{
        // it is not the owner just delete it from participants
        GroupRooms[userRoomId].participants.splice(
          GroupRooms[userRoomId].participants.findIndex(
            (participant) => participant.userName === userName
          ),
          1
        );

      }

    }

    // deleting user from the records
    delete connectedUsers_IDtoUserName[socket.id];
    delete connectedUsers_UserNametoId[userName];
    delete connectedUsers_IDtoRoomId[socket.id];

    // const userRoom = GroupRooms[connectedUsers_IDtoRoomId[socket.id]];
    // if( userRoom && userRoom.participants.length){
    //   GroupRooms[socket.id].participants = userRoom.participant.splice(userRoom.participants.findIndex(connectedUsers_IDtoUserName[socket.id]),1);
    //   if(!GroupRooms[socket.id].participants.length){
    //     delete GroupRooms[connectedUsers_IDtoRoomId[socket.id]];
    //     console.log(`room with id ${connectedUsers_IDtoRoomId[socket.id]} was deleted!`);
    //     return;
    //   }
    //   if(userRoom.owner  === connectedUsers_IDtoUserName[socket.id]){
    //     GroupRooms[socket.id].owner = userRoom.participants[0];
    //   }
    //   return;
    // }

    // delete GroupRooms[connectedUsers_IDtoRoomId[socket.id]];
  });

  // get room owner video time
  socket.on("getVideoTime",(data)=>{
    if(!GroupRooms[data.roomId]){
      console.log('Room not found');
      return;
    }
    const roomOwner = GroupRooms[data.roomId].owner;
    io.to(connectedUsers_UserNametoId[roomOwner]).emit("requestedVideoTime",{userId: socket.id});
    utils.logSocketEvent(`Video time requested by user: ${connectedUsers_IDtoRoomId[socket.id]}, with id: ${socket.id}`);
  })

  socket.on("videoTimeSent",(data)=>{
    if(!data.userId){
      console.log('missing user id ');
      return;
    }
    io.to(data.userId).emit("setVidoTime",{videoTime: data.videoTime});
    utils.logSocketEvent(`Video Time was sent to user: ${connectedUsers_IDtoUserName[data.userId]}, with id: ${data.userId}`);
  })


});


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", (err) => {
  console.log(err);
});
server.on("listening", () => {
  console.log(`Server is running on port ${port}`);
});

