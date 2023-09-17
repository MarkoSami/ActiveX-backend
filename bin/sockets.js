const { randomBytes } = require('crypto');
const app = require('../app');
const debug = require('debug')('application:server');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const utils = require('../lib/utils');

let  io;

// Store room information 
let RandomOneToOneRooms = [];// rooms which are available to join randomly between 2 persons
  
let oneToOneRoom = [];//private room bwtewwn 2 persons

let RandomGroupRooms = [];//rooms which are available to join randomly between 2 or more persons

let GroupRooms = [];//private rooms between 2 or more persons

let connectedUsers_IDtoUserName = new Map(); // socket ids mapped to their usernames
let connectedUsers_UserNametoId = new Map(); // socket ids mapped to their usernames



const runIO = (server)=>{
    // establish socketIO server
    io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'],
      credentials: true
    }
  });
  
  
  
  io.on("connection", (socket,userName) => {
    // console.log(socket.id);
    connectedUsers_IDtoUserName.set(socket.id,userName);
    connectedUsers_UserNametoId.set(userName,socket.id);
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
      console.log('user joined random room ' + roomId);
      console.log("____________________________________");
      socket.emit('joined_random_room', roomId);
  
    });
  
  
  
  
    socket.on('create_room', () => {
      const roomID = uuidv4();
      GroupRooms.push(roomID);
      socket.join(roomID);
      io.emit('room_created', roomID);
      console.log(`User created and joined a new  room , room ID : ${roomID}`);
      console.log("____________________________________");
    })
  
  
    socket.on('join_room', (roomId) => {
  
      socket.join(roomId);
      console.log(`User joined room , room ID: ${roomId}`);
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
  
  
    socket.on("video_ready", (data) => {
      console.log(data);
      socket.to(data.roomId).emit("video_ready_to", data.video_URL)
      console.log(`Video started in room ${data.roomId} , URL ${data.video_URL}`);
      console.log("____________________________________");
  
    })
  
  
  
    socket.on("send_message", (data) => {
      socket.to(data.messageData.room).emit("message_received", data.messageData);
      // console.log(`Broadcasted a message to all the clients... message: ${data.messageData.room}`);
    });
  
    
    socket.on("load_feed", () => {
      // to do
    })
    socket.on("load_comments", () => {
  
    })
  
  });
};


module.exports = {
    runIO,
    io,
    connectedUsers_IDtoUserName,
    connectedUsers_UserNametoId
};