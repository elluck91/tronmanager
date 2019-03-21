import React, { Component } from 'react';
import '../stylesheets/Terminal.css';
import { Subscriber } from '../services/subscribe';

class Terminal extends Component {
   constructor(props) {
      super(props);

      this.state = {
         output: [],
         cmd: "",
         ip: "OM-fullnode-1"
         //ip: "oregon-redis-1-001"
      };

      this.handleInputChange = this.handleInputChange.bind(this);
      this.handleIpChange = this.handleIpChange.bind(this);
      this.updateOutput = this.updateOutput.bind(this);
      this.handleExecuteCmd = this.handleExecuteCmd.bind(this);
      this.handleTopProcessesBy = this.handleTopProcessesBy.bind(this);
      this.handleAllHosts = this.handleAllHosts.bind(this);
      this.handleLatestBlock = this.handleLatestBlock.bind(this);
      this.handleCacheNodeMetrics = this.handleCacheNodeMetrics.bind(this);
      this.handleCheckFullNodeHealth = this.handleCheckFullNodeHealth.bind(this);
      this.handleAllFullNodes = this.handleAllFullNodes.bind(this);

      this.sub = new Subscriber();
      this.sub.subscribeToExecuteCmd(this.updateOutput);
      this.sub.subscribeToTopProcessesBy(this.updateOutput);
      this.sub.subscribeToAllHosts(this.updateOutput);
      this.sub.subscribeToLatestBlock(this.updateOutput);
      this.sub.subscribeToCacheNodeMetrics(this.updateOutput);
      this.sub.subscribeToCheckFullNodeHealth(this.updateOutput);
      this.sub.subscribeToFullNodes(this.updateOutput);
   }

   clearOutput() {
      this.setState({
         output: []
      });
   }

   handleInputChange(event) {
      this.setState({
         cmd: event.target.value
      });
   }

   handleIpChange(event) {
       this.setState({
           ip: event.target.value
       })
   }

   updateOutput(err, newOutput) {
       console.log(newOutput);
       this.setState({
           output: [...this.state.output, JSON.stringify(newOutput)]
       });
   }

   handleExecuteCmd(event) {
      event.preventDefault();
      this.clearOutput();
      this.sub.executeCmd(this.state);
      this.setState({
         cmd: ""
      })
   }

   handleTopProcessesBy(event) {
       event.preventDefault();
       this.clearOutput();
       this.sub.getTopProcessesBy(this.state.ip);
   }

   handleAllHosts() {
       this.clearOutput();
       this.sub.getAllHosts()
   }

   handleLatestBlock(event) {
       event.preventDefault();
       this.clearOutput();
       this.sub.getLatestBlock(this.state.ip);
   }

   handleAllCacheNodes() {
       this.clearOutput();
       this.sub.getCacheNodes()
   }

   handleCacheNodeMetrics(event) {
       event.preventDefault();
       this.clearOutput();
       this.sub.getCacheNodeMetrics(this.state.ip);
   }

   handleCheckFullNodeHealth(event) {
       event.preventDefault();
       // this.clearOutput();
       this.sub.checkFullNodeHealth(this.state.ip)
   }

   handleAllFullNodes() {
       this.clearOutput();
       this.sub.getFullNodes()
   }

   render() {
       return (
           <div>
            <p>Output:</p>
                <div className="shell-body">
                    {this.state.output.length ? this.state.output.map((item, i) => (<li key={i}>{Object.values(item)}</li>)) : '----------'}
                </div>
            {/* ExecuteCmd */}
            <form onSubmit={this.handleExecuteCmd}>
                <label>
                    Cmd:
                    <input type="text" value={this.state.cmd} onChange={this.handleInputChange} />
                    Node Name:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="ExecuteCmd" />
            </form>

            {/* TopProcessesBy */}
            <form onSubmit={this.handleTopProcessesBy}>
                <label>
                    Node Name:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="TopProcessesBy" />
            </form>

            {/* AllHosts */}
            <button onClick={this.handleAllHosts}>
               getAllHosts
            </button>

            {/* LatestBlock */}
            <form onSubmit={this.handleLatestBlock}>
                <label>
                    Node Name:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="LatestBlock" />
            </form>

            {/* AllCacheNodes */}
            <button onClick={this.handleAllCacheNodes}>
               getAllCacheNodes
            </button>

            {/* CacheNodeMetrics */}
            <form onSubmit={this.handleCacheNodeMetrics}>
                <label>
                    cacheNodeId:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="getCacheNodeMetrics" />
            </form>

            {/* CheckFullnodeHealth */}
            <form onSubmit={this.handleCheckFullNodeHealth}>
                <label>
                    Node Name:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="CheckFullNodeHealth" />
            </form>

            {/* getAllFullNodes */}
            <button onClick={this.handleAllFullNodes}>
               getAllFullNodes
            </button>
         </div>
      );
   }
}

export default Terminal;
