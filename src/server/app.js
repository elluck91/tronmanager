require('dotenv').config({ path: './.env' })

var app = require('express')();
var http = require('http').createServer(app);
var readline = require('readline');
const { spawn } = require('child_process');
var exec = require('ssh-exec');
var fs = require('fs');
var request = require('request');
var trex = require('./API/tronExecutor');

// Socket for continuous stream of cmd output
const server = require('socket.io')(http)

server.on('connection', (socket) => {
   
   // Request info about all hosts
   socket.on('reqHosts', (region) => {
      console.log('Requested region:', region);
      trex.getAllHosts(socket);
   });

   // Remote execution requested
   socket.on('reqExecute', (data) => {
      const host = data.nodeIP;
      const cmd = data.command.split(' ');

      socket.emit('resExecute', trex.customExec(cmd, host, (err, response) => {
         if (err) return err;
         return response;
      }));

      socket.disconnect();
   });

   // Metrics requested
   socket.on('reqMetrics', (data) => {
      var host = data.nodeIP;
      var metric = data.metric;

      socket.emit('resMetrics', trex.getTopProcessBy(metric, host, (err, response) => {
         if (err) return err;
         return response;
      }));
   });
   
   socket.on('disconnect', function(){
      console.log('user disconnected');
   });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
