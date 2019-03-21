import openSocket from 'socket.io-client';

class Subscriber {
    constructor() {
        this.socket = openSocket('http://localhost:3001');
    }

    subscribeToAllHosts(updateClientView) {
       this.socket.on('resAllHosts', output => updateClientView(null, output));
    }

    getAllHosts() {
        this.socket.emit('reqAllHosts');
    }

    subscribeToFullNodes(updateClientView) {
       this.socket.on('resFullNodes', output => updateClientView(null, output));
    }

    getFullNodes() {
        this.socket.emit('reqFullNodes');
    }

    subscribeToEventrons(updateClientView) {
       this.socket.on('resEventrons', output => updateClientView(null, output));
    }

    getEventrons() {
        this.socket.emit('reqEventrons');
    }

    subscribeToBlockParsers(updateClientView) {
       this.socket.on('resBlockParsers', output => updateClientView(null, output));
    }

    getBlockParsers() {
        this.socket.emit('reqBlockParsers');
    }

    subscribeToZoneProxies(updateClientView) {
       this.socket.on('resZoneProxies', output => updateClientView(null, output));
    }

    getZoneProxies() {
        this.socket.emit('reqZoneProxies');
    }

    subscribeToCacheNodes(updateClientView) {
       this.socket.on('resCacheNodes', output => updateClientView(null, output));
    }

    getCacheNodes() {
        this.socket.emit('reqCacheNodes');
    }

    subscribeToCacheNodeMetrics(updateClientView) {
        this.socket.on('resCacheNodeMetrics', output => updateClientView(null, output));
    }

    getCacheNodeMetrics(cacheNodeId) {
        this.socket.emit('reqCacheNodeMetrics', cacheNodeId);
    }

    subscribeToTopProcessesBy(updateClientView) {
       this.socket.on('resTopProcessesBy', output => updateClientView(null, output));
    }

    getTopProcessesBy(nodeId) {
        this.socket.emit('reqTopProcessesBy', nodeId);
    }

    subscribeToLatestBlock(updateClientView) {
       this.socket.on('resLatestBlock', output => {
           updateClientView(null, output);
       });
    }

    getLatestBlock(nodeId) {
        this.socket.emit('reqLatestBlock', nodeId);
    }

    subscribeToCheckFullNodeHealth(updateClientView) {
        this.socket.on('resCheckFullNodeHealth', async output => {
            console.log('Got health report')
            updateClientView(null, output)
        });
    }

    checkFullNodeHealth(nodeId) {
        this.socket.emit('reqCheckFullNodeHealth', nodeId);
    }

    subscribeToExecuteCmd(updateClientView) {
       // defines how to update client view when new output appears
       this.socket.on('resExecuteCmd', output => {
           updateClientView(null, output);
       });
    }

    executeCmd(data) {
        this.socket.emit('reqExecuteCmd', data);
    }
}

export { Subscriber }
