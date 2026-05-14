// src/utils/performanceMonitor.js - Performance Monitoring Utility
const os = require('os');

class PerformanceMonitor {
    constructor() {
        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
        this.startTime = Date.now();
    }

    // Middleware to track request performance
    trackRequest() {
        return (req, res, next) => {
            const start = Date.now();

            // Track when response finishes
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.requestCount++;
                this.totalResponseTime += duration;

                // Log slow requests (> 1 second)
                if (duration > 1000) {
                    console.warn(`⚠️ SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
                }

                // Track errors
                if (res.statusCode >= 400) {
                    this.errorCount++;
                }
            });

            next();
        };
    }

    // Get system metrics
    getSystemMetrics() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = process.memoryUsage();

        return {
            system: {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                freeMemory: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                usedMemory: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                memoryUsagePercent: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
                uptime: `${(os.uptime() / 60 / 60).toFixed(2)} hours`
            },
            process: {
                pid: process.pid,
                uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
                memoryUsage: {
                    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
                },
                cpu: process.cpuUsage()
            }
        };
    }

    // Get application metrics
    getAppMetrics() {
        const uptime = Date.now() - this.startTime;
        const avgResponseTime = this.requestCount > 0 
            ? (this.totalResponseTime / this.requestCount).toFixed(2) 
            : 0;

        return {
            uptime: `${(uptime / 1000 / 60).toFixed(2)} minutes`,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: this.requestCount > 0 
                ? `${((this.errorCount / this.requestCount) * 100).toFixed(2)}%` 
                : '0%',
            avgResponseTime: `${avgResponseTime}ms`,
            requestsPerMinute: ((this.requestCount / (uptime / 1000 / 60))).toFixed(2)
        };
    }

    // Get all metrics
    getAllMetrics() {
        return {
            timestamp: new Date().toISOString(),
            system: this.getSystemMetrics(),
            application: this.getAppMetrics()
        };
    }

    // Log metrics to console
    logMetrics() {
        const metrics = this.getAllMetrics();
        console.log('\n📊 ===== PERFORMANCE METRICS =====');
        console.log('⏱️  Application Uptime:', metrics.application.uptime);
        console.log('📈 Total Requests:', metrics.application.requestCount);
        console.log('⚡ Avg Response Time:', metrics.application.avgResponseTime);
        console.log('📉 Error Rate:', metrics.application.errorRate);
        console.log('💾 Memory Used:', metrics.system.process.memoryUsage.heapUsed);
        console.log('🖥️  System Memory:', metrics.system.system.memoryUsagePercent);
        console.log('================================\n');
    }

    // Reset metrics
    reset() {
        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
        this.startTime = Date.now();
    }

    // Force garbage collection (if --expose-gc flag is set)
    forceGC() {
        if (global.gc) {
            console.log('🗑️  Running garbage collection...');
            global.gc();
            console.log('✅ Garbage collection completed');
        } else {
            console.log('⚠️  Garbage collection not available. Start node with --expose-gc flag');
        }
    }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
