import openSocket from 'socket.io-client';

class Subscriber {
    constructor() {
        this.socket = openSocket('http://localhost:3001');
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

    subscribeToTopProcessesBy(updateClientView) {
       this.socket.on('resTopProcessesBy', output => updateClientView(null, output));
    }

    getTopProcessesBy(ip) {
        this.socket.emit('reqTopProcessesBy', ip);
    }

    subscribeToAllHosts(updateClientView) {
       this.socket.on('resAllHosts', output => updateClientView(null, output));
    }

    getAllHosts() {
        this.socket.emit('reqAllHosts');
    }

    subscribeToLatestBlock(updateClientView) {
       this.socket.on('resLatestBlock', output => {
           updateClientView(null, output);
       });
    }

    getLatestBlock(ip) {
        this.socket.emit('reqLatestBlock', ip);
    }

    subscribeToAllCacheNodes(updateClientView) {
        this.socket.on('resAllCacheNodes', output => {
            updateClientView(null, output);
        });
    }

    getAllCacheNodes() {
        this.socket.emit('reqAllCacheNodes');
    }

    subscribeToCacheNodeMetrics(updateClientView) {
        this.socket.on('resCacheNodeMetrics', output => updateClientView(null, output));
    }

    getCacheNodeMetrics(cacheNodeId) {
        this.socket.emit('reqCacheNodeMetrics', cacheNodeId);
    }
}

export { Subscriber }
