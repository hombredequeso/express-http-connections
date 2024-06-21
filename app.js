const express = require('express')
const app = express()
const port = 4000
const http = require('node:http');

const Agent = require('agentkeepalive');
const axios = require('axios');

const StatsD = require('node-statsd');

const {execSync, exec} = require('child_process');

const process = require('process');

if (process.pid) {
  console.log('This process is your pid ' + process.pid);
}

const client = new StatsD();

client.socket.on('error', function(error) {
  return console.error("Error in socket: ", error);
});

const NodeProcessMetrics = require('node-process-metrics');
 
// Use synchronously
const pm = new NodeProcessMetrics();

const keepAliveAgent = new Agent({
  maxSockets: 2,
  // maxFreeSockets: 10,
  timeout: 60000, // active socket keepalive for 60 seconds
  freeSocketTimeout: 3000, // free socket keepalive for 30 seconds
});

const options = {
  agent: {http: keepAliveAgent}
}



app.get('/', (req, res) => {
  res.send('Hello World!')
})

// timings:
axios.interceptors.request.use(function (config) {

 config.metadata = { startTime: new Date()}
 return config;
}, function (error) {
 return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
 
  response.config.metadata.endTime = new Date()
  response.duration = response.config.metadata.endTime - response.config.metadata.startTime
  return response;
}, function (error) {
  error.config.metadata.endTime = new Date();
  error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
  return Promise.reject(error);
});

let counter =-1;
let lastResponseTime = null;

app.get('/book', (req, res) => {
  const startTime = new Date();
  axios.get('http://localhost:3000/order/2', {
    httpAgent: keepAliveAgent,
    timeout: 5000
    // signal: AbortSignal.timeout(5000)
  }).then(x => {
    const endTime = new Date();
    lastResponseTime = endTime - startTime;
    // lastResponseTime = x.duration;
    res.send('book response');
  })
})

const server = app.listen(port, () => {
  server.keepAliveTimeout = 10000; // server connections, default 5000ms
  server.maxHeadersCount = 5;     // maximum headers count. default 2000
  console.log(`Example app listening on port ${port}`)
})

const logfdcount = (processId) => {
  const cmd = `ls /proc/${processId}/fd | wc -l`
  exec(cmd, (err, output) => {
      if (err) {
          console.error("could not execute command: ", err)
          return
      }
      console.log("fd count: \n", output)
      client.histogram("fd-count", output);
  })
}

const logmetrics = () => {
  console.log("==========================================================")
  console.log(JSON.stringify(keepAliveAgent.getCurrentStatus(), null, 2));
  const pmMetrics = pm.metrics();
  console.log(`memory:${JSON.stringify(pmMetrics.process.memoryUsage, null, 2)}\nloop delay:${pmMetrics.loop}\nloop handles:${pmMetrics.handles}`)
  console.log(`Last response time: ${lastResponseTime}`)
  logfdcount(process.pid);
}

// process.memoryUsage
// loop
// handles

setInterval(() => {
  logmetrics();
}, 5000);



// const agent = http.globalAgent;

// server.on('connection', function (socket) {
//   console.log('connection');
//   // console.log(JSON.stringify(agent.sockets))
// });


// server.on('connect', function (request, socket, head) {
//   console.log('connect');
// });

// server.on('dropRequest', function (request, socket) {
//   console.log('dropRequest');
// });

// server.on('request', function (request, response) {
//   console.log('request');
// });

