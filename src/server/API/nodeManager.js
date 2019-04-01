var exec = require('ssh-exec')
const axios = require('axios');
const fs = require('fs');
const log4js = require('log4js');

log4js.configure({
  appenders: { log: { type: 'file', filename: 'nodemanager.log' } },
  categories: { default: { appenders: ['log'], level: 'debug' } }
});
const logger = log4js.getLogger('default')

class NodeManager {
    constructor() {
        this.latest_known_block = 0;
        this.latest_block_time = 0;

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
        console.log('returning cache Nodes')
        return this.cacheNodes;
    }

    updateCacheNode(cacheNodeId, nodeMetrics) {
         this.cacheNodes[cacheNodeId]['Metrics']['CPU']['Timestamps']
             .push(nodeMetrics['CPU']['Timestamps']);
         this.cacheNodes[cacheNodeId]['Metrics']['CPU']['Values']
             .push(nodeMetrics['CPU']['Values']);
         this.cacheNodes[cacheNodeId]['Metrics']['Freeable Memory']['Timestamps']
             .push(nodeMetrics['Freeable Memory']['Timestamps']);
         this.cacheNodes[cacheNodeId]['Metrics']['Freeable Memory']['Values']
             .push(nodeMetrics['Freeable Memory']['Values']);

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
    getTopProcessesBy(metric, nodeName, respond) {
        if (!this.fullNodes[nodeName]) respond('Unknown node.');
        else {
            // linux distros prepend metrics with '%'
            let m = metric == 'CPU' ? '%CPU' : '%MEM';

            // top: displays information about processes
            // -b: batch, -n 1: takes a snapshot of processes usage
            // -o: sort descending, head -n 12: first 12 lines
            // tail -5: last 5 lines, awk to get only relevant columns
            var cmd = "top -b -n 1 -o " + m +
            " | head -n 12 | tail -5 | awk '{ print $9,$10,$12 }'";

            exec(cmd, this.config(this.fullNodes[nodeName]['Instance IP']),
                (err, stdout, stderr) => {
                    if (err) respond(err);
                    else if (stdout) respond(null, this.processPSOutput(stdout));
                    else respond(null, stderr);
                }
            );
        }
    }

    customExecuteCmd(cmd, nodeName, respond) {
        let node = this.getNodeByName(nodeName);
        exec(cmd, this.config(node['Instance IP']), (err, stdout, stderr) => {
            if (err) respond(err);
            else if (stdout) respond(null, this.processCmdOutput(stdout));
            else respond(null, stderr);
        });
    }

    async getLatestBlock2(nodeId) {
        try {
            let url = 'http://' + this.fullNodes[nodeId]['Instance IP'] + "/wallet/getnowblock"
            let block = await axios.get('http://' + this.fullNodes[nodeId]['Instance IP'] + "/wallet/getnowblock")
            return {
                'block_number': block.data.block_header.raw_data.number,
                'block_time': block.data.block_header.raw_data.timestamp
            }
        } catch (e) {
            console.log('error:', e)
            return false;
        }

    }

    async getLatestBlock(healthReport) {
        try {
            let url = 'http://' + healthReport['node_ip'] + "/wallet/getnowblock"
            logger.debug('getting block:', url)
            let block = await axios.get('http://' + healthReport['node_ip'] + "/wallet/getnowblock")
            logger.debug('Node ' + healthReport['node_name'] + ' returned a block.');
            Object.assign(healthReport, {
                'block_retrieved': true,
                'block_number': block.data.block_header.raw_data.number,
                'block_time': block.data.block_header.raw_data.timestamp
            })

            if (healthReport['block_number'] > this.latest_known_block) {
                this.latest_known_block = healthReport['block_number'];
                this.latest_block_time = healthReport['block_time'];
                healthReport['block_is_latest'] = true
            } else {
                healthReport['block_is_latest'] = false;
            }

        } catch (e) {
            logger.debug(healthReport['node_name'] + ` did not return a block.`);
            logger.debug(e);
            Object.assign(healthReport, {
                'block_retrieved': false,
                'node_is_known': true
            });
        }
    }

    async checkFullNodeHealth(nodeId) {
        let healthReport = {
            'is_healthy': null,
            'node_name': nodeId,
            'node_is_known': null,
            'node_ip': null,
            'node_type': null,
            'block_retrieved': null,
            'retrieval_time': new Date(),
            'block_number': null,
            'block_time': null,
            'block_is_latest': null,
        }

        await this.nodeIsFullNode(healthReport)
        if (healthReport['node_type'] != 'fullnode') {
            healthReport['is_healthy'] = 'unknown';
            return healthReport;
        }

        await this.hasBlock(healthReport);
        if (!healthReport['block_retrieved'])
            return healthReport;

        await this.isBlockLatest(healthReport)
        if (!healthReport['block_is_latest'])
            return healthReport;

        healthReport['is_healthy'] = true;

        return healthReport;
    }

    async nodeIsFullNode(healthReport) {
        healthReport['node_type'] = Object.keys(this.fullNodes).includes(healthReport['node_name']) ? 'fullnode' : 'unknown';
        console.log('218', healthReport['node_type'])
        if (healthReport['node_type'] == 'fullnode') {
            console.log('This is a full node')
            healthReport['node_is_known'] = true;
            healthReport['node_ip'] = this.fullNodes[healthReport['node_name']]['Instance IP'];
        } else {
            console.log('Node is not a full node.')
        }
    }

    async hasBlock(healthReport) {
        console.log('Checking if the node has a block.')
        await this.getLatestBlock(healthReport);
        if (!healthReport['block_retrieved']) {
            healthReport['is_healthy'] = false;
        }
    }

    async isBlockLatest(healthReport) {
        healthReport['block_is_latest'] = this.latest_known_block == healthReport['block_number'];
        if (!healthReport['block_is_latest']) {
            healthReport['is_healthy'] = false;
        }
        logger.debug('returning from is block latest')
    }

    async checkCacheNodeHealth(nodeId) {
        let healthReport = {
            'is_healthy': null,
            'node_name': nodeId,
            'node_is_known': null,
            'active': null,
            'node_type': null,
            'cpu_usage': null,
            'cpu_healthy': null,
            'memory_healthy': null,
            'memory_usage': null
        }

        await this.nodeIsCacheNode(healthReport)
        if (healthReport['node_type'] != 'cachenode')
            return healthReport;

        await this.hasRecentData(healthReport);
        if (!healthReport['active'])
            return healthReport;

        await this.isDataGood(healthReport)
        return healthReport;
    }

    nodeIsCacheNode(healthReport) {
        healthReport['node_type'] = Object.keys(this.cacheNodes).includes(healthReport['node_name']) ? 'cachenode' : 'unknown';
        healthReport['node_is_known'] = healthReport['node_type'] == 'cachenode' ? true : false;
    }

    hasRecentData(healthReport) {
        const cpu = this.cacheNodes[healthReport['node_name']]['Metrics']['CPU']['Values'];
        if (cpu) healthReport['cpu_usage'] = cpu[cpu.length - 1];
        const memory = this.cacheNodes[healthReport['node_name']]['Metrics']['Freeable Memory']['Values'];
        if (memory) healthReport['memory_usage'] = memory[memory.length - 1];

        if (memory && cpu) {
            let currentTime = new Date();
            let timestamps = this.cacheNodes[healthReport['node_name']]['Metrics']['Freeable Memory']['Timestamps'];
            healthReport['active'] = currentTime - timestamps[timestamps.length - 1] <= 300000
        } else {
            healthReport['active'] = false;
        }
    }

    isDataGood(healthReport) {
        let lastCpuMeasurement = this.cacheNodes[healthReport['node_name']]['Metrics']['CPU']['Values'];
        healthReport['cpu_healthy'] = lastCpuMeasurement[lastCpuMeasurement.length - 1] < 10;
        let lastMemoryMeasurement = this.cacheNodes[healthReport['node_name']]['Metrics']['Freeable Memory']['Values'];
        healthReport['memory_healthy'] = lastMemoryMeasurement[lastMemoryMeasurement.length - 1] < 8000000000;

        healthReport['is_healthy'] = healthReport['cpu_healthy'] && healthReport['memory_healthy'];
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

    getNodeByName(nodeName, nodeType = undefined) {
        if (!nodeType) {
            if (this.fullNodes.hasOwnProperty(nodeName)) return this.fullNodes[nodeName];
            else if (this.zoneProxies.hasOwnProperty(nodeName)) return this.zoneProxies[nodeName];
            else if (this.cacheNodes.hasOwnProperty(nodeName)) return this.cacheNodes[nodeName];
        }
        switch(nodeType) {
            case 'fullnode':
                return this.fullNodes[nodeName];
                break;
            case 'eventron':
                return this.eventrons[nodeName];
                break;
            case 'blockparser':
                return this.blockParsers[nodeName];
                break;
            case 'zoneproxy':
                return this.zoneProxies[nodeName];
                break;
            case 'cachenode':
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
