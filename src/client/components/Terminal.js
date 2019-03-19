import React, { Component } from 'react';
import '../stylesheets/Terminal.css';
import { Subscriber } from '../services/subscribe';

class Terminal extends Component {
   constructor(props) {
      super(props);

      this.state = {
         output: [],
         cmd: "",
         ip: "OX-fullnode-1"
      };

      this.handleInputChange = this.handleInputChange.bind(this);
      this.handleIpChange = this.handleIpChange.bind(this);
      this.updateOutput = this.updateOutput.bind(this);
      this.handleExecuteCmd = this.handleExecuteCmd.bind(this);
      this.handleTopProcessesBy = this.handleTopProcessesBy.bind(this);
      this.handleAllHosts = this.handleAllHosts.bind(this);
      this.handleLatestBlock = this.handleLatestBlock.bind(this);

      this.sub = new Subscriber();
      this.sub.subscribeToExecuteCmd(this.updateOutput);
      this.sub.subscribeToTopProcessesBy(this.updateOutput);
      this.sub.subscribeToAllHosts(this.updateOutput);
      this.sub.subscribeToLatestBlock(this.updateOutput);
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
                    IP:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="ExecuteCmd" />
            </form>

            {/* TopProcessesBy */}
            <form onSubmit={this.handleTopProcessesBy}>
                <label>
                    IP:
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
                    IP:
                    <input type="text" value={this.state.ip} onChange={this.handleIpChange} />
                </label>
                <input type="submit" value="LatestBlock" />
            </form>
         </div>
      );
   }
}

export default Terminal;
