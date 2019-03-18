import React, { Component } from 'react';
import '../stylesheets/Terminal.css';
import openSocket from 'socket.io-client';
import { subscribeToCmdOutput, subscribeToPS } from '../services/subscribe';

class Terminal extends Component {
   constructor(props) {
      super(props);
      this.state = {
         output: ['hello'],
         cmd: "",
         ps: {
            'one': "",
            'two': "",
            'three': "",
            'four': "",
            'five': ""
         },
         hosts: [],
      };

      this.handleCommand = this.handleCommand.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
      this.updateOutput = this.updateOutput.bind(this);

      this.updatePS = this.updatePS.bind(this);
      this.handleGetPS = this.handleGetPS.bind(this);

      this.handleGetHosts = this.handleGetHosts.bind(this);
   }

   handleInputChange(event) {
      this.setState({
         cmd: event.target.value
      });
   }

   updateOutput(err, newOutput) {
      this.setState(prevState => ({
         output: [...prevState.output, newOutput]
      }));
      var objDiv = document.getElementById("screen");
      objDiv.scrollTop = objDiv.scrollHeight;
   }

   updatePS(err, psResult) {
      this.setState({
         ps: psResult
      });
   } 

   handleCommand(event) {
      event.preventDefault();
      subscribeToCmdOutput(this.updateOutput, this.state.cmd);
      this.setState({
         cmd: ""
      })
   }

   handleGetPS() {
      subscribeToPS(this.updatePS, '54.188.41.116');
   }

   handleGetHosts() {
      const socket = openSocket('http://localhost:3001');
      socket.on('resHosts', output => {
         console.log('updating stete with new hosts');
         this.setState(prevState => ({
            hosts: [...prevState.hosts, output]
         })); 
      });
      
      socket.emit('reqHosts', 'us-west-2');
   }
   
   render() {
      return (
         <div> 
            <p>Hosts: {JSON.stringify(this.state.hosts)}</p>
            <button onClick={this.handleGetHosts}>
               Host us-west-2 hosts.
            </button>
         </div>
      );
   }
}

export default Terminal;
