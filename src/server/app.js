var app = require('express')();
var http = require('http').createServer(app);
var aws = require('./API/awsHandler');
var trex = require('./API/nodeManager');

// Socket for continuous stream of cmd output
const server = require('socket.io')(http)

server.on('connection', (socket) => {
    console.log('user connected')

    socket.on('reqHealthCheck', (data) => {
        const healthStatus = trex.getHealthUpdate(data.ip, socket);

        if (!healthStatus.isHealthy) {
            alertTronForce(healthStatus);
        }
        socket.emit('resHealthCheck', healthStatus);
    });

   // Request info about all hosts
   socket.on('reqAllHosts', () => {
      aws.getAllHosts(socket);
   });

   // Remote execution requested
   socket.on('reqExecuteCmd', (data) => {
       let ip_addr = aws.getInstance(data.ip);
       trex.customExecuteCmd(data.cmd, ip_addr['Instance IP'], socket);
   });

   // Metrics requested
   socket.on('reqTopProcessesBy', (ip) => {
       let ip_addr = aws.getInstance(ip);
     trex.getTopProcessesBy('CPU', ip_addr['Instance IP'], socket);
   });

   // Latest block requested
   socket.on('reqLatestBlock', (data) => {
       let ip_addr = aws.getInstance(data);
       trex.getLatestBlock(ip_addr['Instance IP'], socket);
   });

   // Request info about all cache nodes
   socket.on('reqAllCacheNodes', () => {
      aws.getAllCacheNodes(socket);
   });

   // Request cacheNode metrics
   socket.on('reqCacheNodeMetrics', (cacheNodeId) => {
       aws.getCacheNodeMetrics(cacheNodeId, socket);
   });

   socket.on('disconnect', function(){
      console.log('user disconnected');
   });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
