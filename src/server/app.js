var app = require('express')();
var http = require('http').createServer(app);
var aws = require('./awsHandler');
var trex = require('./nodeManager');

// Socket for continuous stream of cmd output
const server = require('socket.io')(http)

server.on('connection', (socket) => {
    console.log('user connected')

    socket.on('reqHealthCheck', (data.ip) => {
        const healthStatus = trex.getHealthUpdate(data.ip, socket);

        if (!healthStatus.isHealthy) {
            alertTronForce(healthStatus);
        }
        socket.emit('resHealthCheck', healthStatus);
    })

   // Request info about all hosts
   socket.on('reqAllHosts', () => {
      aws.getAllHosts(socket);
   });


   // Remote execution requested
   socket.on('reqExecuteCmd', (data) => {
     trex.customExecuteCmd(data.cmd, data.ip, socket);
   });

   // Metrics requested
   socket.on('reqTopProcessesBy', (data) => {
     trex.getTopProcessesBy('CPU', data, socket);
   });

   // Latest block requested
   socket.on('reqLatestBlock', (data) => {
       let ip_add = aws.getInstance(data);
       trex.getLatestBlock(data['Instance IP'], socket);
   })

   socket.on('disconnect', function(){
      console.log('user disconnected');
   });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
