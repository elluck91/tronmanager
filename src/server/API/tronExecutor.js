var AwsHandler = require('./awsHandler');

class TronExecutor {

   static getAllHosts(socket) {
      var aws = new AwsHandler();
      aws.getAllHosts(socket);
   };
}

module.exports = TronExecutor;


            /*
            <div className="shell-wrap">
               <p className="shell-top-bar">Tron Monitor</p>
               //<ul className="shell-body" id='screen'>
                  //{this.state.output.map((item, i) => {
                  //   return <li key={i}>{item}</li>;
                  //})}
               //</ul>
            </div>
            <div>
               <form onSubmit={this.handleCommand}>
                  <input type="text" value={this.state.cmd} onChange={this.handleInputChange} />
                  <input type="submit" value="Execute" />
               </form>
            </div>
            <div id='ps'>
               <ul className="shell-body">
                  <li>{this.state.ps.one}</li>
                  <li>{this.state.ps.two}</li>
                  <li>{this.state.ps.three}</li>
                  <li>{this.state.ps.four}</li>
                  <li>{this.state.ps.five}</li>
               </ul>
               <button onClick={this.handleGetHosts}>
                  Host us-west-2 hosts.
               </button>
            </div>
            */
