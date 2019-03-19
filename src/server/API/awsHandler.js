var AWS = require('aws-sdk');

class AwsHandler {
   constructor() {
      this.regions = {
         'O': 'us-west-2',
         'S': 'ap-southeast-1',
         'F': 'eu-central-1'
      }

      this.instances = {}
   }

   storeInstance(instance) {
       console.log(instance)
       this.instances[instance.Name] = instance;
   }

   getInstance(host) {
       if (!this.instances[host]) {
           return {'Instance IP': host};
       }
       return this.instances[host];
   }

   getAllInstances() {
       return this.instances;
   }

   getAllHosts(socket) {
      for (let regionOfInterest of Object.values(this.regions)) {
         AWS.config.update({
            region: regionOfInterest,
            credentials: {
               accessKeyId: process.env.AWSAccessKeyID,
               secretAccessKey: process.env.AWSSecretAccessKey
            }
         })
         var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

         var params = {
            DryRun: false
         };

         ec2.describeInstances(params, (err, data) => {
            if (err) {
               console.log(err);
            }
            for (let inst of data.Reservations) {
               var tempInst = {
                  'ID': inst.Instances[0].InstanceId,
                  'Instance Type': inst.Instances[0].InstanceType,
                  "Instance IP": inst.Instances[0].PublicIpAddress
               }

               for (let tag of inst.Instances[0].Tags) {
                 tempInst[tag.Key] = tag.Value
               }

               this.storeInstance(tempInst);
               socket.emit('resAllHosts', tempInst);
            }
         });
      }
   }
}

module.exports = new AwsHandler();
