var exec = require('ssh-exec')
const axios = require('axios');
const fs = require('fs');

class NodeManager {
    constructor() {
        /* Common properties of fullNode, eventron, blockParser, zoneProxy
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
        this.fullNodes = {};
        this.eventrons = {};
        this.blockParsers = {};
        this.zoneProxies = {};

        /* Example cacheNode
        {
            'Name': 'oregon-redis-1-001',
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
        this.otherNodes = {};

    }

    getFullNodes() {
        return this.fullNodes;
    }

    getEventrons() {
        return this.eventrons;
    }

    getBlockparers() {
        return this.blockParsers;
    }

    getZoneProxies() {
        return this.zoneProxies;
    }

    getCacheNodes() {
        return this.cacheNodes;
    }

    updateCacheNode(cacheNodeId, nodeMetrics) {
         this.cacheNodes[cacheNodeId]['Metrics']['CPU']['Timestamps']
             .push(cacheNodeMetrics['CPU']['Timestamps']);
         this.cacheNodes[cacheNodeId]['Metrics']['CPU']['Values']
             .push(cacheNodeMetrics['CPU']['Values']);
         this.cacheNodes[cacheNodeId]['Metrics']['Freeable Memory']['Timestamps']
             .push(cacheNodeMetrics['Freeable Memory']['Timestamps']);
         this.cacheNodes[cacheNodeId]['Metrics']['Freeable Memory']['Values']
             .push(cacheNodeMetrics['Freeable Memory']['Values']);

         return this.cacheNodes[cacheNodeId];
     }

    getOtherNodes() {
        return this.otherNodes;
    }

    config(ip) {
        return {
            user: 'ec2-user',
            host: ip,
            key: fs.readFileSync(process.env.AWS_PEM)
        };
    }

    // Remote request to get top 5 processes sorted descendingly by CPU usage
    getTopProcessesBy(metric, nodeId) {
        if (!this.fullNodes[nodeId])
            return undefined;

        // linux distros prepend metrics with '%'
        let m = metric == 'CPU' ? '%CPU' : '%MEM';

        // top: displays information about processes
        // -b: batch, -n 1: takes a snapshot of processes usage
        // -o: sort descending, head -n 12: first 12 lines
        // tail -5: last 5 lines, awk to get only relevant columns
        var cmd = "top -b -n 1 -o " + m +
        " | head -n 12 | tail -5 | awk '{ print $9,$10,$12 }'";

        exec(cmd, this.config(this.fullNodes[nodeId]['Instance IP']),
            (err, stdout, stderr) => {
                if (err) {
                    return undefined;
                } else if (stdout) {
                    return this.processPSOutput(stdout);
                } else {
                    return undefined;
                }
            }
        );
    }

    // customExecuteCmd(cmd, ip, socket) {
    //     exec(cmd, this.config(ip), (err, stdout, stderr) => {
    //         if (err) {
    //             socket.emit('resExecuteCmd', err.toString());
    //         } else if (stdout) {
    //             let processedData = this.processCmdOutput(stdout);
    //             socket.emit('resExecuteCmd', this.processCmdOutput(stdout));
    //         } else {
    //             socket.emit('resExecuteCmd', stderr.toString());
    //         }
    //     });
    // }

    async getLatestBlock(nodeId, callback = null) {
        console.log('Attempting to get the latest block of:', nodeId)
        if (!this.fullNodes[nodeId]) {
            return undefined;
        }

        let block = await axios.get('http://' + this.fullNodes[nodeId]['Instance IP']
            + "/wallet/getnowblock")
        return block;
        // .then(function (response) {
        //     console.log('returning from getLatestBlock')
        //     // handle success
        //     return {
        //         'number': response.data.block_header.raw_data.number,
        //         'timestamp': response.data.block_header.raw_data.timestamp
        //     }
        // })
        // .catch(error => {
        //     return undefined;
        // })
    }

    checkFullNodeHealth(nodeId) {
        if (!this.fullNodes[nodeId]) {
            return undefined;
        }

        let healthStatus = {
            'isSick': !this.isSyncing(nodeId)
        }

        return healthStatus;
    }

    isSyncing(nodeId) {
        let blockNumbers = {};
        for (let node in this.fullNodes) {
            console.log('Checking:', node)
            if (!node) {
                continue;
            }

            this.getLatestBlock(node).then(result => {
                console.log(result)
            }

            )

            // tempBlock.then(temp => {
            //     console.log('Attempting to read temp');
            //     console.log(temp)
            //     blockNumbers[node] = {
            //         'timeSinceLatestBlock': new Date().getTime() - temp.timestamp,
            //         'number': temp.number
            //     }
            //     console.log('Node:', node);
            //     console.log(blockNumbers[node]);
            // }).catch(err => {
            //     console.log(err)
            // })
        }


        // if (blockNumbers[nodeId]['timeSinceLatestBlock'] > 5000) {
        //     console.log('Not syncing:', blockNumbers[nodeId]['timeSinceLatestBlock']);
        // }
        //
        // for (let node in blockNumbers) {
        //     if (blockNumbers[nodeId]['number'] != node['number']) {
        //         console.log('My block number:', blockNumbers[nodeId]['number']);
        //         console.log(node, ' block number:', blockNumbers[node].number);
        //     }
        // }

        return true;
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

    getNodeByName(nodeName, nodeType) {
        switch(nodeType) {
            case 'fullnode':
            return this.fullNodes[nodeName];
            break;
            case 'eventron':
            return this.eventrons[nodeName];
            break;
            case 'blockParser':
            return this.blockParsers[nodeName];
            break;
            case 'zoneProxy':
            return this.zoneProxies[nodeName];
            break;
            case 'cacheNode':
            return this.cacheNodes[nodeName];
            break;
            default:
            return this.otherNodes[nodeName];
            break;
        }
    }

    storeNode(node) {
        switch(node.Type) {
            case 'fullnode':
            this.fullNodes[node.Name] = node;
            break;
            case 'eventron':
            this.eventrons[node.Name] = node;
            break;
            case 'blockParser':
            this.blockParsers[node.Name] = node;
            break;
            case 'zoneProxy':
            this.zoneProxies[node.Name] = node;
            break;
            case 'cacheNode':
            this.cacheNodes[node.Name] = node;
            break;
            default:
            this.otherNodes[node.Name] = node;
            break;
        }
        console.log('Saved node type:', node.Type);
    }
}

module.exports = new NodeManager();
