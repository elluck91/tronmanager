var app = require('express')();
var http = require('http').createServer(app);
var aws = require('./API/awsHandler');
var trex = require('./API/nodeManager');
var harbinger = require('./helpers/harbinger');

// Socket for continuous stream of cmd output
const server = require('socket.io')(http)

server.on('connection', (socket) => {
    console.log('user connected')

   // Request info about all hosts
   socket.on('reqAllHosts', (showOutput) => {
      aws.getAllHosts((node) => {
          trex.storeNode(node);
          if (showOutput) socket.emit('resAllHosts', node);
      });

      aws.getAllCacheNodes((node) => {
          trex.storeNode(node);
          if (showOutput) socket.emit('resAllHosts', node);
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

   socket.on('reqCacheNodes', async () => {
       console.log('requesting cache nodes')
       let cacheNodes = await trex.getCacheNodes();
       console.log('App got cache nodes:', cacheNodes);
       socket.emit('resCacheNodes', cacheNodes)
   })

   // Request cacheNode metrics
   socket.on('reqCacheNodeMetrics', (nodeName) => {
       if (!trex.getNodeByName(nodeName, 'cachenode')) {
           socket.emit('resCacheNodeMetrics', {
               'id': nodeName,
               'status': 404,
               'data': 'Unknown cache node.'
           })
       } else {
           aws.getCacheNodeMetrics(trex.getNodeByName(nodeName, 'cachenode'), (err, nodeMetrics) => {
               if (err) {
                   socket.emit('resCacheNodeMetrics', {
                       'id': nodeName,
                       'status': 404,
                       'data': err
                   });
               } else {
                   socket.emit('resCacheNodeMetrics', {
                       'id': nodeName,
                       'status': 200,
                       'data': trex.updateCacheNode(nodeName, nodeMetrics)
                   });
               }
           });
       }
   });

   // Metrics requested
   socket.on('reqTopProcessesBy', (nodeId) => {
       trex.getTopProcessesBy('CPU', nodeId, (err, response) => {
           if (err) {
               socket.emit('resTopProcessesBy', {
                   'id': nodeId,
                   'status': 404,
                   'data': err
               })
           } else {
               socket.emit('resTopProcessesBy', {
                   'id': nodeId,
                   'status': 200,
                   'data': response
               });
           }
       });
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

   // FULL NODE HEALTH CHECK
   socket.on('reqCheckFullNodeHealth', async (nodeId) => {
       const healthReport = await trex.checkFullNodeHealth(nodeId);

       if (healthReport['is_healthy'] != false) {
           harbinger.alertTronForce(healthReport);
       }
       socket.emit('resCheckFullNodeHealth', healthReport);
   });

   // CACHE NODE HEALTH CHECK
   socket.on('reqCheckCacheNodeHealth', async (nodeId) => {
       const healthReport = await trex.checkCacheNodeHealth(nodeId);

       if (healthReport['is_healthy'] != false) {
           harbinger.alertTronForce(healthReport);
       }
       socket.emit('resCheckCacheNodeHealth', healthReport);
   });

   // Remote execution requested
   socket.on('reqExecuteCmd', (data) => {
       trex.customExecuteCmd(data.cmd, data.ip, (err, response) => {
           if (err) {
               socket.emit('resExecuteCmd', {
               'id': data.ip,
               'status': 404,
               'data': err.toString()
           })} else {
               socket.emit('resExecuteCmd', {
                   'id': data.ip,
                   'status': 200,
                   'data': response
               })
           }

       });
   });

   socket.on('disconnect', function(){
      console.log('user disconnected');
   });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
