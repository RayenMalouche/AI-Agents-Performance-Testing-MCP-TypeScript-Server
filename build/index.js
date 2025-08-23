#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs/promises"));
class PerformanceTestServer {
    server;
    testResults = new Map();
    loadTestResults = new Map();
    isRunning = false;
    constructor() {
        this.server = new index_js_1.Server({
            name: 'performance-test-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'run_performance_test',
                    description: 'Run a single performance test against the Discovery Intech MCP client',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The query to test',
                            },
                            targetUrl: {
                                type: 'string',
                                description: 'Target Discovery client URL (default: http://localhost:8072)',
                            },
                            testId: {
                                type: 'string',
                                description: 'Unique test identifier',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'run_load_test',
                    description: 'Run a load test with multiple concurrent requests',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            queries: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of queries to test',
                            },
                            concurrentUsers: {
                                type: 'number',
                                description: 'Number of concurrent users',
                                default: 5,
                            },
                            requestsPerUser: {
                                type: 'number',
                                description: 'Number of requests per user',
                                default: 2,
                            },
                            targetUrl: {
                                type: 'string',
                                description: 'Target Discovery client URL',
                            },
                        },
                        required: ['queries'],
                    },
                },
                {
                    name: 'analyze_test_results',
                    description: 'Analyze and summarize test results',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            testIds: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Specific test IDs to analyze (optional)',
                            },
                            generateReport: {
                                type: 'boolean',
                                description: 'Generate a detailed report file',
                                default: false,
                            },
                        },
                    },
                },
                {
                    name: 'monitor_costs',
                    description: 'Monitor and track API costs',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            timeframe: {
                                type: 'string',
                                description: 'Timeframe for cost analysis (hour, day, week)',
                                default: 'day',
                            },
                            modelName: {
                                type: 'string',
                                description: 'AI model name for cost calculation',
                                default: 'llama-3.1-8b-instant',
                            },
                        },
                    },
                },
                {
                    name: 'benchmark_scenarios',
                    description: 'Run predefined benchmark scenarios for Discovery Intech',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            scenarios: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: ['sage', 'qad', 'microsoft', 'sap', 'sectors', 'services', 'company', 'all']
                                },
                                description: 'Scenarios to benchmark',
                                default: ['all'],
                            },
                            targetUrl: {
                                type: 'string',
                                description: 'Target Discovery client URL',
                            },
                        },
                    },
                },
                {
                    name: 'export_results',
                    description: 'Export test results to various formats',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            format: {
                                type: 'string',
                                enum: ['json', 'csv', 'html'],
                                description: 'Export format',
                                default: 'json',
                            },
                            filepath: {
                                type: 'string',
                                description: 'Output file path',
                            },
                            includeDetails: {
                                type: 'boolean',
                                description: 'Include detailed test data',
                                default: true,
                            },
                        },
                        required: ['filepath'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case 'run_performance_test':
                    return this.runPerformanceTest(request.params.arguments);
                case 'run_load_test':
                    return this.runLoadTest(request.params.arguments);
                case 'analyze_test_results':
                    return this.analyzeTestResults(request.params.arguments);
                case 'monitor_costs':
                    return this.monitorCosts(request.params.arguments);
                case 'benchmark_scenarios':
                    return this.benchmarkScenarios(request.params.arguments);
                case 'export_results':
                    return this.exportResults(request.params.arguments);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
            }
        });
    }
    async runPerformanceTest(args) {
        const query = args.query;
        const targetUrl = args.targetUrl || 'http://localhost:8072';
        const testId = args.testId || `test_${Date.now()}`;
        const startTime = Date.now();
        const testResult = {
            testId,
            timestamp: new Date().toISOString(),
            query,
            responseTime: 0,
            success: false,
        };
        try {
            // Call the Discovery Intech client
            const response = await axios_1.default.post(`${targetUrl}/api/chat`, {
                message: query,
                timestamp: new Date().toISOString(),
            }, {
                timeout: 300000, // 5 minutes timeout
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const endTime = Date.now();
            testResult.responseTime = endTime - startTime;
            testResult.success = true;
            // Analyze response
            const responseData = response.data;
            this.analyzeResponseData(responseData, testResult);
            this.testResults.set(testId, testResult);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            testId,
                            success: true,
                            responseTime: testResult.responseTime,
                            tokensUsed: testResult.tokensUsed,
                            cost: testResult.cost,
                            datasetSize: testResult.datasetSize,
                            mcpCallsCount: testResult.mcpCallsCount,
                            urlsFetched: testResult.urlsFetched,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            const endTime = Date.now();
            testResult.responseTime = endTime - startTime;
            testResult.success = false;
            testResult.errorMessage = error.message;
            this.testResults.set(testId, testResult);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            testId,
                            success: false,
                            error: error.message,
                            responseTime: testResult.responseTime,
                        }, null, 2),
                    },
                ],
            };
        }
    }
    analyzeResponseData(responseData, testResult) {
        const responseText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
        // Count dataset elements
        const jsonMatches = responseText.match(/"Input":\s*"/g);
        testResult.datasetSize = jsonMatches ? jsonMatches.length : 0;
        // Count MCP calls
        const mcpPatterns = ['get_markdown', 'get_raw_text', 'get_rendered_html', 'send-email'];
        testResult.mcpCallsCount = mcpPatterns.reduce((count, pattern) => {
            const matches = responseText.split(pattern).length - 1;
            return count + matches;
        }, 0);
        // Extract URLs
        const urlMatches = responseText.match(/https:\/\/www\.discoveryintech\.com[^\s]*/g);
        testResult.urlsFetched = urlMatches ? [...new Set(urlMatches)] : [];
        // Estimate tokens (rough estimation: ~4 chars per token)
        testResult.tokensUsed = Math.ceil(responseText.length / 4);
        // Calculate cost (Groq pricing for llama-3.1-8b-instant)
        const inputCostPer1K = 0.05; // cents
        const outputCostPer1K = 0.08; // cents
        const inputTokens = testResult.tokensUsed * 0.7; // 70% input
        const outputTokens = testResult.tokensUsed * 0.3; // 30% output
        testResult.cost = (inputTokens / 1000 * inputCostPer1K) + (outputTokens / 1000 * outputCostPer1K);
    }
    async runLoadTest(args) {
        const queries = args.queries;
        const concurrentUsers = args.concurrentUsers || 5;
        const requestsPerUser = args.requestsPerUser || 2;
        const targetUrl = args.targetUrl || 'http://localhost:8072';
        const loadTestId = `load_test_${Date.now()}`;
        const startTime = new Date();
        const promises = [];
        // Create test promises
        for (let user = 0; user < concurrentUsers; user++) {
            for (let req = 0; req < requestsPerUser; req++) {
                const query = queries[req % queries.length];
                const testId = `${loadTestId}_user${user}_req${req}`;
                const promise = this.executePerformanceTest(query, targetUrl, testId);
                promises.push(promise);
            }
        }
        // Execute all tests concurrently
        const results = await Promise.allSettled(promises);
        const endTime = new Date();
        // Process results
        const successfulTests = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const failedTests = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
        const totalResponseTime = successfulTests.reduce((sum, r) => {
            return sum + (r.status === 'fulfilled' ? r.value.responseTime : 0);
        }, 0);
        const totalTokens = successfulTests.reduce((sum, r) => {
            return sum + (r.status === 'fulfilled' ? (r.value.tokensUsed || 0) : 0);
        }, 0);
        const totalCost = successfulTests.reduce((sum, r) => {
            return sum + (r.status === 'fulfilled' ? (r.value.cost || 0) : 0);
        }, 0);
        const loadTestResult = {
            testId: loadTestId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            totalTests: promises.length,
            successfulTests: successfulTests.length,
            failedTests: failedTests.length,
            averageResponseTime: totalResponseTime / successfulTests.length || 0,
            totalTokens,
            totalCost,
            concurrentUsers,
            requestsPerUser,
        };
        this.loadTestResults.set(loadTestId, loadTestResult);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(loadTestResult, null, 2),
                },
            ],
        };
    }
    async executePerformanceTest(query, targetUrl, testId) {
        const startTime = Date.now();
        const testResult = {
            testId,
            timestamp: new Date().toISOString(),
            query,
            responseTime: 0,
            success: false,
        };
        try {
            const response = await axios_1.default.post(`${targetUrl}/api/chat`, {
                message: query,
                timestamp: new Date().toISOString(),
            }, {
                timeout: 300000,
                headers: { 'Content-Type': 'application/json' },
            });
            testResult.responseTime = Date.now() - startTime;
            testResult.success = true;
            this.analyzeResponseData(response.data, testResult);
            this.testResults.set(testId, testResult);
            return testResult;
        }
        catch (error) {
            testResult.responseTime = Date.now() - startTime;
            testResult.errorMessage = error.message;
            this.testResults.set(testId, testResult);
            return testResult;
        }
    }
    async analyzeTestResults(args) {
        const testIds = args.testIds;
        const generateReport = args.generateReport || false;
        const resultsToAnalyze = testIds
            ? Array.from(this.testResults.values()).filter(r => testIds.includes(r.testId))
            : Array.from(this.testResults.values());
        if (resultsToAnalyze.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: 'No test results found to analyze.',
                    }],
            };
        }
        const analysis = {
            totalTests: resultsToAnalyze.length,
            successfulTests: resultsToAnalyze.filter(r => r.success).length,
            failedTests: resultsToAnalyze.filter(r => !r.success).length,
            averageResponseTime: this.calculateAverage(resultsToAnalyze.map(r => r.responseTime)),
            totalTokensUsed: resultsToAnalyze.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
            totalCost: resultsToAnalyze.reduce((sum, r) => sum + (r.cost || 0), 0),
            averageDatasetSize: this.calculateAverage(resultsToAnalyze.map(r => r.datasetSize || 0)),
            averageMcpCalls: this.calculateAverage(resultsToAnalyze.map(r => r.mcpCallsCount || 0)),
            uniqueUrlsFetched: this.getUniqueUrls(resultsToAnalyze),
            performanceMetrics: {
                fastest: Math.min(...resultsToAnalyze.map(r => r.responseTime)),
                slowest: Math.max(...resultsToAnalyze.map(r => r.responseTime)),
                median: this.calculateMedian(resultsToAnalyze.map(r => r.responseTime)),
            },
        };
        if (generateReport) {
            await this.generateDetailedReport(analysis, resultsToAnalyze);
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(analysis, null, 2),
                }],
        };
    }
    async monitorCosts(args) {
        const timeframe = args.timeframe || 'day';
        const modelName = args.modelName || 'llama-3.1-8b-instant';
        const now = new Date();
        const timeframeLimits = {
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
        };
        const limit = timeframeLimits[timeframe] || timeframeLimits.day;
        const cutoffTime = new Date(now.getTime() - limit);
        const recentTests = Array.from(this.testResults.values())
            .filter(r => new Date(r.timestamp) > cutoffTime);
        const costAnalysis = {
            timeframe,
            modelName,
            periodStart: cutoffTime.toISOString(),
            periodEnd: now.toISOString(),
            totalTests: recentTests.length,
            totalTokens: recentTests.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
            totalCost: recentTests.reduce((sum, r) => sum + (r.cost || 0), 0),
            averageCostPerTest: 0,
            projectedMonthlyCost: 0,
        };
        if (recentTests.length > 0) {
            costAnalysis.averageCostPerTest = costAnalysis.totalCost / recentTests.length;
            // Project monthly cost based on current usage pattern
            const testsPerHour = recentTests.length / (limit / (60 * 60 * 1000));
            const projectedMonthlyTests = testsPerHour * 24 * 30;
            costAnalysis.projectedMonthlyCost = projectedMonthlyTests * costAnalysis.averageCostPerTest;
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(costAnalysis, null, 2),
                }],
        };
    }
    async benchmarkScenarios(args) {
        const scenarios = args.scenarios || ['all'];
        const targetUrl = args.targetUrl || 'http://localhost:8072';
        const predefinedScenarios = {
            sage: 'Créez un dataset complet sur toutes les solutions Sage de Discovery Intech',
            qad: 'Générez un dataset détaillé sur les solutions QAD proposées par Discovery Intech',
            microsoft: 'Produisez un dataset sur les solutions Microsoft Dynamics 365 de Discovery Intech',
            sap: 'Créez un dataset sur les solutions SAP proposées par Discovery Intech',
            sectors: 'Générez un dataset sur tous les secteurs d\'activité couverts par Discovery Intech',
            services: 'Créez un dataset sur tous les services proposés par Discovery Intech',
            company: 'Produisez un dataset sur l\'entreprise Discovery Intech (équipe, partenaires, références)',
        };
        const scenariosToRun = scenarios.includes('all')
            ? Object.keys(predefinedScenarios)
            : scenarios.filter((s) => predefinedScenarios.hasOwnProperty(s));
        const benchmarkId = `benchmark_${Date.now()}`;
        const results = [];
        for (const scenario of scenariosToRun) {
            const query = predefinedScenarios[scenario];
            const testId = `${benchmarkId}_${scenario}`;
            try {
                const testResult = await this.executePerformanceTest(query, targetUrl, testId);
                results.push({
                    scenario,
                    ...testResult,
                });
            }
            catch (error) {
                results.push({
                    scenario,
                    testId,
                    success: false,
                    error: error.message,
                });
            }
        }
        const benchmarkSummary = {
            benchmarkId,
            timestamp: new Date().toISOString(),
            totalScenarios: results.length,
            successfulScenarios: results.filter(r => r.success).length,
            results,
            summary: {
                averageResponseTime: this.calculateAverage(results.filter(r => r.success).map(r => r.responseTime)),
                totalTokens: results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
                totalCost: results.reduce((sum, r) => sum + (r.cost || 0), 0),
            },
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(benchmarkSummary, null, 2),
                }],
        };
    }
    async exportResults(args) {
        const format = args.format || 'json';
        const filepath = args.filepath;
        const includeDetails = args.includeDetails !== false;
        const allResults = Array.from(this.testResults.values());
        const allLoadTests = Array.from(this.loadTestResults.values());
        let exportData = {
            exportTimestamp: new Date().toISOString(),
            summary: {
                totalTests: allResults.length,
                totalLoadTests: allLoadTests.length,
                successfulTests: allResults.filter(r => r.success).length,
            },
        };
        if (includeDetails) {
            exportData.testResults = allResults;
            exportData.loadTestResults = allLoadTests;
        }
        let content;
        switch (format) {
            case 'json':
                content = JSON.stringify(exportData, null, 2);
                break;
            case 'csv':
                content = this.convertToCSV(allResults);
                break;
            case 'html':
                content = this.generateHTMLReport(exportData);
                break;
            default:
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `Unsupported format: ${format}`);
        }
        try {
            await fs.writeFile(filepath, content, 'utf-8');
            return {
                content: [{
                        type: 'text',
                        text: `Results exported successfully to ${filepath}`,
                    }],
            };
        }
        catch (error) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to write file: ${error.message}`);
        }
    }
    calculateAverage(numbers) {
        if (numbers.length === 0)
            return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
    calculateMedian(numbers) {
        if (numbers.length === 0)
            return 0;
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    }
    getUniqueUrls(results) {
        const allUrls = results.flatMap(r => r.urlsFetched || []);
        return [...new Set(allUrls)];
    }
    async generateDetailedReport(analysis, results) {
        const reportPath = `performance_report_${Date.now()}.html`;
        const htmlContent = this.generateHTMLReport({ analysis, results });
        await fs.writeFile(reportPath, htmlContent, 'utf-8');
        console.log(`Detailed report generated: ${reportPath}`);
    }
    convertToCSV(results) {
        const headers = 'testId,timestamp,query,responseTime,success,tokensUsed,cost,datasetSize,mcpCallsCount,errorMessage\n';
        const rows = results.map(r => `"${r.testId}","${r.timestamp}","${r.query}",${r.responseTime},${r.success},${r.tokensUsed || 0},${r.cost || 0},${r.datasetSize || 0},${r.mcpCallsCount || 0},"${r.errorMessage || ''}"`).join('\n');
        return headers + rows;
    }
    generateHTMLReport(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .success { color: #4CAF50; }
        .failure { color: #f44336; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <div class="metric">
            <div class="metric-value">${data.summary?.totalTests || 0}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary?.successfulTests || 0}</div>
            <div class="metric-label">Successful Tests</div>
        </div>
    </div>
    <p>Generated on: ${new Date().toISOString()}</p>
</body>
</html>`;
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('Performance Test MCP Server running on stdio');
    }
}
const server = new PerformanceTestServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map