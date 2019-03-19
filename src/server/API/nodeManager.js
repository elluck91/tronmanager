var exec = require('ssh-exec')
const axios = require('axios');
const fs = require('fs');

class NodeManager {
    constructor() {
        this.nodeStatus = {};
    }

    config(ip) {
        return {
           user: 'ec2-user',
           host: ip,
           key: fs.readFileSync(process.env.AWS_PEM)
        };
    }

    checkNodeHealth(ip, socket) {
        let healthStatus = {
            'isSyncing' : isSyncing(ip),
        }

        healthStatus.isHealthy = healthStatus.isSyncing;

        return healthStatus;
    }

    isSyncing(ip) {
        return timestampUpdates(ip) && blockUpdates(ip);
    }

    timestampUpdates(ip) {
        return (nodeStats[ip].getTime(-1) != nodeStats[up].getTime(-2));
    }

   // Remote request to get top 5 processes sorted descendingly by CPU usage
   getTopProcessesBy(metric, ip, socket) {

      // linux distros prepend metrics with '%'
      let m = metric == 'CPU' ? '%CPU' : '%MEM';

      // top: displays information about processes
      // -b: batch, -n 1: takes a snapshot of processes usage
      // -o: sort descending, head -n 12: first 12 lines
      // tail -5: last 5 lines, awk to get only relevant columns
      var cmd = "top -b -n 1 -o " + m +
         " | head -n 12 | tail -5 | awk '{ print $9,$10,$12 }'";

      exec(cmd, this.config(ip), (err, stdout, stderr) => {
         if (err) {
            socket.emit('resTopProcessesBy', err);
         } else if (stdout) {
            socket.emit('resTopProcessesBy', this.processPSOutput(stdout));
         } else {
             socket.emit('resTopProcessesBy', stderr);

         }
      });
   }

    customExecuteCmd(cmd, ip, socket) {
       exec(cmd, this.config(ip), (err, stdout, stderr) => {
          if (err) {
             socket.emit('resExecuteCmd', err.toString());
          } else if (stdout) {
             let processedData = this.processCmdOutput(stdout);
             socket.emit('resExecuteCmd', this.processCmdOutput(stdout));
          } else {
             socket.emit('resExecuteCmd', stderr.toString());
          }
        });


   }

    getLatestBlock(ip, socket) {
       console.log('trex received ip:', ip)
       axios.get('http://' + ip + "/wallet/getnowblock")
        .then(function (response) {
            // handle success
            socket.emit('resLatestBlock', {
                'number': response.data.block_header.raw_data.number,
                'timestamp': response.data.block_header.raw_data.timestamp
            });
        })
        .catch(error => {
            console.log(error)
            socket.emit('resLatestBlock', 'error')
        })
    }

    // Utilities
    processPSOutput(output) {
      // response formatting
      var result = output.split('\n').splice(0,5);
      var response = {};

      for (let i = 0; i < result.length; i++) {
         response[i] = result[i].split(' ');
      }

      // element at index:
      // 0: CPU
      // 1: MEM
      // 2: CMD
      return response;
   }

    processCmdOutput(output) {
       // response formatting
       var result = output.split('\n');
       return result.splice(0, result.length - 1);
   }
}

module.exports = new NodeManager();
