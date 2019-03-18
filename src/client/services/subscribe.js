import openSocket from 'socket.io-client';

function subscribeToCmdOutput(updateClientView, commandToExecute) {
   const socket = openSocket('http://localhost:3001');
   // defines how to update client view when new output appears
   socket.on('output', output => updateClientView(null, output));
   
   socket.emit('execute', commandToExecute);
} 

function subscribeToPS(updateClientView, nodeId) {
   const socket = openSocket('http://localhost:3001');
   socket.on('resNowBlock', output => updateClientView(null, output));
   socket.emit('reqNowBlock', nodeId);
}
export { subscribeToCmdOutput, subscribeToPS }
