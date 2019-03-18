var AWS = require('aws-sdk');
//var dynamo = require('./dynamo')

class AwsHandler {
   constructor() {
      this.regions = {
         'O': 'us-west-2',
         'S': 'ap-southeast-1',
         'F': 'eu-central-1' 
      }
   }

   getAllHosts(socket) {
      for (let regionOfInterest of Object.values(this.regions)) {
         console.log('current region of interest:', regionOfInterest);
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
               console.log("AWS returned new instance.");
               socket.emit('resHosts', tempInst);
            }
         });
      }
   }
}
/*
function createTags(res) {
   for (let instance of res.Items) {
      let usage = instance.usage;

      if (instance.type == 'eventron') {
         usage = 'all';
      }

      if (usage == 'production') {
         usage = 'mainnet';
      }

      if (usage == 'zoneProxy') {
         usage = 'all';
      }

      let type = instance.type;

      if (type == 'fullNode')
         type = 'fullnode';
      else if (type == 'tronEvents')
         type = 'eventron'

      var params = {
         Resources: [ instance.instance_id ], 
         Tags: [
            {
               Key: "Upstream",
               Value: instance.upstream
            },
            {
               Key: "Usage",
               Value: usage
            },
            {
               Key: "Load Balancer",
               Value: instance.load_balancer
            },
            {
               Key: "Type",
               Value: type
            },
           {
               Key: "Status",
               Value: "active"
            }
         ]
      };

      ec2.createTags(params, function(err, data) {
         if (err) console.log(err, err.stack); // an error occurred
         else     console.log(data);           // successful response
      });
   }
}

function getRegionData(callback) {
   dynamo.all().then(resolve => {callback(resolve)}).catch(error => {console.log("ERROR:", error)});
}

function deleteTag(db_results, tag) {
   for (let instance of db_results.Items) {

      var params = {
        Resources: [
          instance.instance_id
        ],
        Tags: [
          {
            Key: tag
          },
        ]
      };

      ec2.deleteTags(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
   }
}


function getIP(name) {
  var params = {
      DryRun: false
   };

   ec2.describeInstances(params, (err, data) => {
      
      for (let inst of data.Reservations) {
         for (let tag of inst.Instances[0].Tags) {
            if (tag.Value == name) {
               console.log(inst.Instances[0].PublicIpAddress)
               return;
            }
         }
      }
   });
}

function describeInstance(instance_id) {
   var params = {
      InstanceIds: [
         instance_id
      ]
   };

   ec2.describeInstances(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data.Reservations[0].Instances);           // successful response
   });   
}

getIP('OM-fullnode-1');
*/

module.exports = AwsHandler 
