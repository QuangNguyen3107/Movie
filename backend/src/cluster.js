// src/cluster.js - Cluster Mode for Production
const cluster = require('cluster');
const os = require('os');
const path = require('path');

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Master process ${process.pid} is running`);
    console.log(`🖥️  Forking ${numCPUs} worker processes...`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
        console.log(`⚠️  Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
        console.log('🔄 Starting a new worker...');
        cluster.fork();
    });

    // Log when workers are online
    cluster.on('online', (worker) => {
        console.log(`✅ Worker ${worker.process.pid} is online`);
    });

    // Handle worker disconnect
    cluster.on('disconnect', (worker) => {
        console.log(`📤 Worker ${worker.process.pid} disconnected`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('📤 SIGTERM signal received. Shutting down gracefully...');
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        setTimeout(() => {
            process.exit(0);
        }, 5000);
    });

    process.on('SIGINT', () => {
        console.log('📤 SIGINT signal received. Shutting down gracefully...');
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        setTimeout(() => {
            process.exit(0);
        }, 5000);
    });

} else {
    // Worker process - load the actual server
    require('./server.js');
    console.log(`👷 Worker ${process.pid} started`);
}
