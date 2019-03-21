var app = require('express')();
var http = require('http').createServer(app);
var aws = require('./API/awsHandler');
var trex = require('./API/nodeManager');

// Socket for continuous stream of cmd output
const server = require('socket.io')(http)

server.on('connection', (socket) => {
    console.log('user connected')

   // Request info about all hosts
   socket.on('reqAllHosts', () => {
      aws.getAllHosts((node) => {
          trex.storeNode(node);
          socket.emit('resAllHosts', node);
      });

      aws.getAllCacheNodes((node) => {
          trex.storeNode(node);
          socket.emit('resAllHosts', node);
      })
   });

   socket.on('reqFullNodes', () => {
       socket.emit('resFullNodes', trex.getFullNodes());
   })

   socket.on('reqEventrons', () => {
       socket.emit('resEventrons', trex.getEventrons());
   })

   socket.on('reqBlockParsers', () => {
       socket.emit('resBlockParsers', trex.getBlockparsers());
   })

   socket.on('reqZoneProxies', () => {
       socket.emit('resZoneProxies', trex.getZoneProxies());
   })

   socket.on('reqCacheNodes', () => {
       socket.emit('resCacheNodes', trex.getCacheNodes())
   })

   // Request cacheNode metrics
   socket.on('reqCacheNodeMetrics', (cacheNodeId) => {

       aws.getCacheNodeMetrics(cacheNodeId, (err, nodeMetrics) => {
           if (err) {
               socket.emit('resCacheNodeMetrics', {
                   'id': cacheNodeId,
                   'status': 404,
               });
           } else {
               socket.emit('resCacheNodeMetrics', {
                   'id': cacheNodeId,
                   'status': 200,
                   'data': trex.updateCacheNode(cacheNodeId, nodeMetrics)
               });
           }
       });
   });

   // Metrics requested
   socket.on('reqTopProcessesBy', (nodeId) => {
       let topProcesses = trex.getTopProcessesBy('CPU', nodeId);
       if (!topProcesses) {
           socket.emit('resTopProcessesBy', {
               'id': nodeId,
               'status': 404
           });
       } else {
           socket.emit('resTopProcessesBy', {
               'id': nodeId,
               'status': 200,
               'data': latestBlock
           });
       }
   });

   // Latest block requested
   socket.on('reqLatestBlock', async (nodeId) => {
       let latestBlock = await trex.getLatestBlock2(nodeId);

       if (!latestBlock) {
           socket.emit('resLatestBlock', {
               'id': nodeId,
               'status': 404
           })
       } else {
           socket.emit('resLatestBlock', {
               'id': nodeId,
               'status': 200,
               'data': latestBlock
           });
       }

   });

   socket.on('reqCheckFullNodeHealth', async (nodeId) => {
       const healthReport = await trex.checkFullNodeHealth(nodeId);

       if (healthReport['is_healthy'])
       socket.emit('resCheckFullNodeHealth', healthReport);
       console.log('emitted message')
   });

   // Remote execution requested
   socket.on('reqExecuteCmd', (data) => {
       let ip_addr = aws.getInstance(data.ip);
       trex.customExecuteCmd(data.cmd, ip_addr['Instance IP'], socket);
   });

   socket.on('disconnect', function(){
      console.log('user disconnected');
   });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
