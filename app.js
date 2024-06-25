const express = require('express')
const app = express()
const port = 4000
const http = require('node:http');

const Agent = require('agentkeepalive');
const axios = require('axios');

const StatsD = require('node-statsd');

const {execSync, exec} = require('child_process');

const process = require('process');

// Configuration:
//
//
const statsDMetricPrefix = 'http-cxn-tester.'

// Client Http requests
const requestAbortTimeout = 2000; // 2sec. http client request timeout.

if (process.pid) {
  console.log('This process is your pid ' + process.pid);
}

const statsdClient = new StatsD({
  prefix: statsDMetricPrefix
});

statsdClient.socket.on('error', function(error) {
  return console.error("Error in socket: ", error);
});

const NodeProcessMetrics = require('node-process-metrics');
 
// Use synchronously
const pm = new NodeProcessMetrics();

const createKeepAliveAgent = () => {
  return new Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    freeSocketTimeout: 4000,
    timeout: 8000,
    // maxSockets: 100,       // defaults to infinity
    maxFreeSockets: 256,
    // socketActiveTTL: 100000    // default: null (meaning socket only released when free)
  });
}


let keepAliveAgent = createKeepAliveAgent();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/resetagent', (req, res) => {
  keepAliveAgent = createKeepAliveAgent();
  res.send('KeepAliveAgent reset')
})

app.post('/starttest', (req, res) => {
  statsdClient.increment('start-test');
  res.send('start test')
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

app.get('/book', (req, res) => {
  const startTime = new Date();
  axios.get('http://localhost:3000/order/2', {
    httpAgent: keepAliveAgent,
    // timeout: 5000
    // signal: AbortSignal.timeout(requestAbortTimeout)
  }).then(x => {
    const endTime = new Date();
    res.send('book response');
    statsdClient.increment("get-book");
    statsdClient.timing("get-book.response-time", endTime - startTime);
  }).catch(e => {
    const errorMessage = e.message ?? "request failure";
    console.log(`request failure: ${errorMessage}`);
    res
      .status(500)
      .send(errorMessage);
  })
})

const server = app.listen(port, () => {
  server.keepAliveTimeout = 5000; // server connections, default 5000ms
  server.maxHeadersCount = 5;     // maximum headers count. default 2000
  console.log(`Example app listening on port ${port}`)
})



const logfdcount = (processId) => {
  const cmd = process.platform === 'darwin' ?
    `lsof -p ${processId} | wc -l`:
    `ls /proc/${processId}/fd | wc -l`;
  exec(cmd, (err, output) => {
    if (err) {
      console.error("could not execute command: ", err)
      return
    }
    const fdCount = parseInt(output.trim(), 10);
    statsdClient.gauge("fd-count", fdCount);
  });
}

const logKeepAliveAgentStatus = (status) => {
    statsdClient.gauge("keep-alive.createSocketCount", status.createSocketCount);
    statsdClient.gauge("keep-alive.createSocketErrorCount", status.createSocketErrorCount);
    statsdClient.gauge("keep-alive.closeSocketCount", status.closeSocketCount);
    statsdClient.gauge("keep-alive.errorSocketCount", status.errorSocketCount);
    statsdClient.gauge("keep-alive.timeoutSocketCount", status.timeoutSocketCount);
    statsdClient.gauge("keep-alive.requestCount", status.requestCount);
}

const logPmMetrics = (pmMetrics) => {
    statsdClient.gauge("pm.process.memoryUsage.rss", pmMetrics.process.memoryUsage.rss);
    statsdClient.gauge("pm.process.memoryUsage.heapTotal", pmMetrics.process.memoryUsage.heapTotal);
    statsdClient.gauge("pm.process.memoryUsage.heapUsed", pmMetrics.process.memoryUsage.heapUsed);
    statsdClient.gauge("pm.process.memoryUsage.external", pmMetrics.process.memoryUsage.external);
    statsdClient.gauge("pm.process.memoryUsage.arrayBuffers", pmMetrics.process.memoryUsage.arrayBuffers);

    statsdClient.gauge("pm.loop-delay", pmMetrics.loop);
    statsdClient.gauge("pm.handles", pmMetrics.handlers);
}

const logmetrics = (forceLog) => {
  // console.log("==========================================================")
  // console.log(JSON.stringify(keepAliveAgent.getCurrentStatus(), null, 2));
  if (keepAliveAgent.statusChanged | forceLog) {
    logKeepAliveAgentStatus(keepAliveAgent.getCurrentStatus());
  }
  logPmMetrics(pm.metrics());

  const pmMetrics = pm.metrics();
  // console.log(`memory:${JSON.stringify(pmMetrics.process.memoryUsage, null, 2)}\nloop delay:${pmMetrics.loop}\nloop handles:${pmMetrics.handles}`)


  logfdcount(process.pid);
}

// process.memoryUsage
// loop
// handles
//
let forceLog = true;

setInterval(() => {
  logmetrics(forceLog);
  forceLog = false;
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

