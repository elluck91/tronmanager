var AWS = require('aws-sdk');

const redisParams = {MaxRecords: 100,ShowCacheNodeInfo: true};
const regions = {'O': 'us-west-2','S': 'ap-southeast-1','F': 'eu-central-1'}

class AwsHandler {
   configParams(newRegion) {
       return {
           region: newRegion,
           credentials: {
              accessKeyId: process.env.AWSAccessKeyID,
              secretAccessKey: process.env.AWSSecretAccessKey
           }
       }
   }

   // get all EC2 from AWS and store locally
   getAllHosts(storeNode) {
       for (let regionOfInterest of Object.values(regions)) {

           let ec2 = new AWS.EC2(this.configParams(regionOfInterest));

            ec2.describeInstances((err, data) => {
                if (err) console.log(err);
                else {
                    for (let instance of data.Reservations) {
                        const tempInstance = this.parseInstance(instance);
                        storeNode(tempInstance);
                    }
                }
            });
        }
    }

   // get all cache nodes AWS and store locally
   getAllCacheNodes(storeNode) {
       for (let regionOfInterest of Object.values(regions)) {

           let elastiCache = new AWS.ElastiCache(this.configParams(regionOfInterest));
           elastiCache.describeCacheClusters(redisParams, (err, data) => {
               if (err) console.log(err);
               else {
                   for (let node of data.CacheClusters) {
                       const tempCacheNode = this.parseCacheNode(node)
                       storeNode(tempCacheNode);
                   }
                }
            });
        }
    }

    configCacheNodeParams(node) {
        var endTime = new Date();
        var startTime = new Date(endTime);
        let delta = 2;

        // using delta = 2, b/c sometimes cpu_usage and freeable_memory
        // do not align and cpu_usage returns empty array
        startTime.setMinutes(endTime.getMinutes() - delta);
        console.log('inside configCacheNodeParams:', node.CacheClusterId, '\n\n\n');
        return {
           EndTime: endTime,
           MetricDataQueries: [
               {
                   Id: 'cpu_usage',
                   MetricStat: {
                       Metric: {
                           Dimensions: [
                               {
                                   Name: 'CacheClusterId',
                                   Value: node.CacheClusterId,
                               },
                               {
                                   Name: 'CacheNodeId',
                                   Value: node.CacheNodeId
                               }
                           ],
                           MetricName: 'CPUUtilization',
                           Namespace: 'AWS/ElastiCache'
                       },
                       Period: 60, /* time in seconds */
                       Stat: 'Average',
                       Unit: 'Percent'
                   },
                   ReturnData: true
               },
               {
                   Id: 'freeable_memory',
                   MetricStat: {
                       Metric: {
                           Dimensions: [
                               {
                                   Name: 'CacheClusterId',
                                   Value: node.CacheClusterId,
                               },
                               {
                                   Name: 'CacheNodeId',
                                   Value: node.CacheNodeId
                               }
                           ],
                           MetricName: 'FreeableMemory',
                           Namespace: 'AWS/ElastiCache'
                       },
                       Period: 60, /* time in seconds */
                       Stat: 'Average',
                       Unit: 'Bytes'
                   },
                   ReturnData: true
               }
           ],
           StartTime: startTime,
           MaxDatapoints: 100,
       }
   }

    getCacheNodeMetrics(cacheNode, updateCacheNode) {
        let region = cacheNode['PreferredAvailabilityZone'];
        region = region.substring(0,region.length - 1)
        console.log('Cache region:', region)
        let cloudWatch = new AWS.CloudWatch(this.configParams(region));
        let params = this.configCacheNodeParams(cacheNode);

        cloudWatch.getMetricData(params, (err, data) => {
            if (err) updateCacheNode(err);
            else {
                let cacheNodeMetrics = this.parseCacheNodeMetrics(data);
                updateCacheNode(null, cacheNodeMetrics);
            }
        });


    }

   /* UTILITIES */
   parseInstance(instance) {
       let tempInstance = {
          'ID': instance.Instances[0].InstanceId,
          'Instance Type': instance.Instances[0].InstanceType,
          "Instance IP": instance.Instances[0].PublicIpAddress
       }

       for (let tag of instance.Instances[0].Tags) {
         tempInstance[tag.Key] = tag.Value;
       }

       return tempInstance;
   }

   parseCacheNode(node) {
       return {
           'Type': 'cacheNode',
           'Name': node.CacheClusterId,
           'CacheClusterId': node.CacheClusterId,
           'CacheNodeType': node.CacheNodeType,
           'PreferredAvailabilityZone': node.PreferredAvailabilityZone,
           'CacheNodeId': node.CacheNodes[0].CacheNodeId,
           'ReplicationGroupId': node.ReplicationGroupId,
           'Address': node.CacheNodes[0].Endpoint.Address,
           'Port': node.CacheNodes[0].Endpoint.Port,
           'Metrics': {
               'CPU': {
                   'Timestamps': [],
                   'Values': []
               },
               'Freeable Memory': {
                   'Timestamps': [],
                   'Values': []
               }
           }
       }
   }

   parseCacheNodeMetrics(metrics) {
       // MetricDataResults[0]: cpu_usage
       // MetricDataResults[1]: freeable_memory
       // Timestamps/Values uses element 0, because that's the latest element
       return {
           'CPU': {
               'Timestamps': metrics.MetricDataResults[0].Timestamps[0],
               'Values': metrics.MetricDataResults[0].Values[0]
           },
           'Freeable Memory': {
               'Timestamps': metrics.MetricDataResults[1].Timestamps[0],
               'Values': metrics.MetricDataResults[1].Values[0]
           }
       }
   }

}

module.exports = new AwsHandler();
