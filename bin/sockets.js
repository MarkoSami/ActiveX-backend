

let io;
module.exports = {
    init: function(server) {
        // start socket.io server and cache io value
        io = require('socket.io')(server, {
          cors: {
            origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
            methods: ['GET', 'POST'],
            allowedHeaders: ['my-custom-header'],
            credentials: true
          }
        });
        console.log(io.on);
        return io;
    },
    getio: function() {
        // return previously cached value
        console.log(io);
        if (!io) {
            throw new Error("must call .init(server) before you can call .getio()");
        }
        return io;
    }
}