var AWS = require('aws-sdk');

const redisParams = {MaxRecords: 100,ShowCacheNodeInfo: true};
const regions = {'O': 'us-west-2','S': 'ap-southeast-1','F': 'eu-central-1'}

class AwsHandler {
   constructor() {
      /* Example instance
        {
            'ID': 'i-0574914ae3d265191',
            'Instance Type': 'c5.4xlarge',
            'Instance IP': '34.217.206.144',
            'Upstream': '-',
            'Type': 'nodeBackup',
            'Status': 'active',
            'Load Balancer': '-',
            'Name': 'OM-backup-1',
            'Usage': 'mainnet'
        }
      */
      this.instances = {};

      /* Example cacheNode
        {
            'CacheClusterId': 'oregon-redis-1-001',
            'CacheNodeType': 'cache.r5.large',
            'PreferredAvailabilityZone': 'us-west-2a',
            'CacheNodeId': '0001',
            'ReplicationGroupId': 'oregon-redis-1',
            'Address': 'oregon-redis-1-001.hyv29s.0001.usw2.cache.amazonaws.com',
            'Port': 6379,
            'Metrics': {
                'CPU': {
                    'Timestamps': ['2019-03-19T20:32:00.000Z', '2019-03-19T20:31:00.000Z'],
                    'Values': [1, 2]
                },
                'Freeable Memory': {
                    'Timestamps': ['2019-03-19T20:32:00.000Z', '2019-03-19T20:31:00.000Z'],
                    'Values': [6907920384, 6907940864]
                }
            }
        }
      */
      this.cacheNodes = {};
   }

   configParams(newRegion) {
       return {
           region: newRegion,
           credentials: {
              accessKeyId: process.env.AWSAccessKeyID,
              secretAccessKey: process.env.AWSSecretAccessKey
           }
       }
   }

   // save instance locally
   storeInstance(instance) {
       console.log(instance)
       this.instances[instance.Name] = instance;
   }

   // get single instance stored locally
   getInstance(host) {
       if (!this.instances[host]) {
           return {'Instance IP': host};
       }
       return this.instances[host];
   }

   // get all EC2 instances stored locally
   getAllInstances() {
       return this.instances;
   }

   // get all EC2 from AWS and store locally
   getAllHosts(socket) {
       for (let regionOfInterest of Object.values(regions)) {

           let ec2 = new AWS.EC2(this.configParams(regionOfInterest));

            ec2.describeInstances((err, data) => {
                if (err) socket.emit('resAllHosts', err);
                else {
                    for (let instance of data.Reservations) {
                        const tempInstance = this.parseInstance(instance);
                        this.storeInstance(tempInstance);
                        socket.emit('resAllHosts', tempInstance);
                    }
                }
            });
        }
    }

   storeCacheNode(node) {
       this.cacheNodes[node.CacheClusterId] = node;
   }

   // get all cache nodes AWS and store locally
   getAllCacheNodes(socket) {
       for (let regionOfInterest of Object.values(regions)) {

           let elastiCache = new AWS.ElastiCache(this.configParams(regionOfInterest));
           elastiCache.describeCacheClusters(redisParams, (err, data) => {
               if (err) socket.emit('resAllCacheNodes', err);
               else {
                   for (let node of data.CacheClusters) {
                       const tempCacheNode = this.parseCacheNode(node)
                       this.storeCacheNode(tempCacheNode);
                       socket.emit('resAllCacheNodes', tempCacheNode);
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

   getCacheNodeById(cacheNodeId) {
       if (!this.cacheNodes[cacheNodeId]) {
           return undefined;
       }
       return this.cacheNodes[cacheNodeId];
   }

   updateCacheNode(cacheNodeMetrics, cacheNodeId) {
        this.cacheNodes[cacheNodeId]['Metrics']['CPU']['Timestamps']
            .push(cacheNodeMetrics['CPU']['Timestamps']);
        this.cacheNodes[cacheNodeId]['Metrics']['CPU']['Values']
            .push(cacheNodeMetrics['CPU']['Values']);
        this.cacheNodes[cacheNodeId]['Metrics']['Freeable Memory']['Timestamps']
            .push(cacheNodeMetrics['Freeable Memory']['Timestamps']);
        this.cacheNodes[cacheNodeId]['Metrics']['Freeable Memory']['Values']
            .push(cacheNodeMetrics['Freeable Memory']['Values']);
   }

    getCacheNodeMetrics(cacheNodeId, socket) {

        let cacheNode = this.getCacheNodeById(cacheNodeId);
        if (!cacheNode) {
            socket.emit('resCacheNodeMetrics', 'Cache Node ' + cacheNodeId + ' does not exist.');
            return;
        }
        let cloudWatch = new AWS.CloudWatch(this.configParams('us-west-2'));
        let params = this.configCacheNodeParams(cacheNode);
        cloudWatch.getMetricData(params, (err, data) => {
            if (err) socket.emit('resCacheNodeMetrics', err);
            else {
                let cacheNodeMetrics = this.parseCacheNodeMetrics(data);
                this.updateCacheNode(cacheNodeMetrics, cacheNodeId);
                socket.emit('resCacheNodeMetrics', this.getCacheNodeById(cacheNodeId));
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
