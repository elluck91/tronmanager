var exec = require('ssh-exec')
const axios = require('axios');
const fs = require('fs');

class RemoteExecutor {

    static config(ip) {
        return {
           user: 'ec2-user',
           host: ip,
           key: fs.readFileSync(process.env.AWS_PEM)
        };
    }

   // Remote request to get top 5 processes sorted descendingly by CPU usage
   static getTopProcessesBy(metric, ip, socket) {

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
             console.log('err:', err)
            socket.emit('resTopProcessesBy', err);
         } else if (stdout) {
             console.log('stdout:', stdout)
            socket.emit('resTopProcessesBy', this.processPSOutput(stdout));
         } else {
             console.log('stderr:', stderr)
             socket.emit('resTopProcessesBy', stderr);

         }
      });
   }

    static customExecuteCmd(cmd, ip, socket) {
       exec(cmd, this.config(ip), (err, stdout, stderr) => {
          if (err) {
             console.log('Err:', err);
             socket.emit('resExecuteCmd', err.toString());
          } else if (stdout) {
             console.log('Stdout:', stdout);
             let processedData = this.processCmdOutput(stdout);
             console.log('Processed data:', processedData)
             socket.emit('resExecuteCmd', this.processCmdOutput(stdout));
          } else {
              console.log('Stderr:', stderr);
             socket.emit('resExecuteCmd', stderr.toString());
          }
        });


   }

   static getLatestBlock(ip, socket) {
       axios.get('http://' + ip + "/wallet/getnowblock")
        .then(function (response) {
            console.log('Do we even get here?')
            console.log(response.data.block_header.raw_data)
            // handle success
            socket.emit('resLatestBlock', {
                'number': response.data.block_header.raw_data.number,
                'timestamp': response.data.block_header.raw_data.timestamp
            });
        })
    }

   // Utilities

   static processPSOutput(output) {
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

   static processCmdOutput(output) {
       // response formatting
       var result = output.split('\n');
       return result.splice(0, result.length - 1);
   }
}

module.exports = RemoteExecutor;
