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
    console.log('user connected')
   // Request info about all hosts
   socket.on('reqAllHosts', (region) => {
      trex.getAllHosts(socket);
   });

   // Remote execution requested
   socket.on('reqExecuteCmd', (data) => {
     trex.customExecuteCmd(data, socket);
   });

   // Metrics requested
   socket.on('reqTopProcessesBy', (data) => {
     trex.getTopProcessesBy(data, socket);
   });

   // Latest block requested
   socket.on('reqLatestBlock', (data) => {
       trex.getLatestBlock(data, socket);
   })

   socket.on('disconnect', function(){
      console.log('user disconnected');
   });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
