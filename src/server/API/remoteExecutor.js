class RemoteExecutor {
   
   // Remote request to get top 5 processes sorted descendingly by CPU usage
   getTopProcessBy(metric, nodeIP, respond) {
      
      // linux distros prepend metrics with '%'
      let metric = metric == 'CPU' ? '%CPU' : '%MEM';

      // top: displays information about processes
      // -b: batch, -n 1: takes a snapshot of processes usage
      // -o: sort descending, head -n 12: first 12 lines
      // tail -5: last 5 lines, awk to get only relevant columns
      var cmd = "top -b -n 1 -o " + metric +
         " | head -n 12 | tail -5 | awk '{ print $9,$10,$12 }'";
      
      const settings = {
         user: process.env.EC2-USER,
         host: nodeIP,
         key: fs.readFileSync(process.env.AWS_PEM)
      };
      
      exec(cmd, settings, (err, stdout, stderr) => {
         if (err) {
            respond(err);
         } else if (stdout) {
            respond(processPSOutput(stdout));
         } else {
            respond(stderr)
         }
      });
   }

   // Utilities
   processPSOutput(output) {
      // response formatting
      var result = output.split('\n').splice(0,6);
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

   customExecute(cmd, respond) {
      
   }
}
