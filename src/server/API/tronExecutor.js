var AwsHandler = require('./awsHandler');
var RemoteExecutor = require('./remoteExecutor');

class TronExecutor {

    static customExecuteCmd(data, socket) {
        RemoteExecutor.customExecuteCmd(data.cmd, data.ip, socket);
    }

    static getTopProcessesBy(data, socket) {
        RemoteExecutor.getTopProcessesBy('CPU', data, socket);
    }

    static getAllHosts(socket) {
       var aws = new AwsHandler();
       aws.getAllHosts(socket);
    };

   static getLatestBlock(ip, socket) {
       RemoteExecutor.getLatestBlock(ip, socket);
   }
}

module.exports = TronExecutor;
