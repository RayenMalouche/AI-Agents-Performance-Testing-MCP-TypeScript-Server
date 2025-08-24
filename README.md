# MCP Performance Test Server

A Model Context Protocol (MCP) server designed to performance test and benchmark Discovery Intech MCP client applications. This server provides comprehensive testing tools for analyzing response times, token usage, costs, and system performance under various load conditions.

## Features

- **Single Performance Tests**: Execute individual queries and measure detailed metrics
- **Load Testing**: Simulate multiple concurrent users with configurable request patterns
- **Cost Monitoring**: Track API costs and token usage with projections
- **Benchmark Scenarios**: Run predefined test scenarios for Discovery Intech solutions
- **Results Analysis**: Generate detailed performance analytics and reports
- **Export Capabilities**: Export results in JSON, CSV, or HTML formats

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- TypeScript
- Access to Discovery Intech MCP client (default: http://localhost:8072)

### Setup

1. Clone or download the project files
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Project Structure

```
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript output
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Available Tools

### 1. `run_performance_test`

Execute a single performance test against the Discovery Intech client.

**Parameters:**
- `query` (required): The query string to test
- `targetUrl` (optional): Target Discovery client URL (default: http://localhost:8072)
- `testId` (optional): Unique test identifier

**Returns:**
- Test ID, response time, token usage, cost estimation, dataset size, MCP calls count, and URLs fetched

### 2. `run_load_test`

Simulate multiple concurrent users performing tests.

**Parameters:**
- `queries` (required): Array of query strings to test
- `concurrentUsers` (optional): Number of concurrent users (default: 5)
- `requestsPerUser` (optional): Number of requests per user (default: 2)
- `targetUrl` (optional): Target Discovery client URL

**Returns:**
- Load test summary with aggregated metrics

### 3. `analyze_test_results`

Analyze and summarize collected test results.

**Parameters:**
- `testIds` (optional): Specific test IDs to analyze
- `generateReport` (optional): Generate detailed HTML report (default: false)

**Returns:**
- Comprehensive analysis including performance metrics, costs, and success rates

### 4. `monitor_costs`

Monitor API costs and usage patterns.

**Parameters:**
- `timeframe` (optional): Analysis period - "hour", "day", or "week" (default: "day")
- `modelName` (optional): AI model for cost calculation (default: "llama-3.1-8b-instant")

**Returns:**
- Cost analysis with projections and usage patterns

### 5. `benchmark_scenarios`

Run predefined benchmark scenarios for Discovery Intech solutions.

**Parameters:**
- `scenarios` (optional): Array of scenarios to run (default: ["all"])
  - Available scenarios: "sage", "qad", "microsoft", "sap", "sectors", "services", "company", "all"
- `targetUrl` (optional): Target Discovery client URL

**Returns:**
- Benchmark results for each scenario with performance metrics

### 6. `export_results`

Export test results to various formats.

**Parameters:**
- `format` (optional): Export format - "json", "csv", or "html" (default: "json")
- `filepath` (required): Output file path
- `includeDetails` (optional): Include detailed test data (default: true)

**Returns:**
- Confirmation of successful export

## Usage Examples

### Basic Performance Test

```bash
# Test a single query
{
  "tool": "run_performance_test",
  "arguments": {
    "query": "Créez un dataset sur les solutions SAP de Discovery Intech",
    "testId": "sap_test_001"
  }
}
```

### Load Testing

```bash
# Simulate 10 concurrent users with 3 requests each
{
  "tool": "run_load_test",
  "arguments": {
    "queries": [
      "Générez un dataset sur les solutions Sage",
      "Créez un dataset sur les secteurs d'activité",
      "Produisez un dataset sur l'équipe Discovery Intech"
    ],
    "concurrentUsers": 10,
    "requestsPerUser": 3
  }
}
```

### Benchmark All Scenarios

```bash
{
  "tool": "benchmark_scenarios",
  "arguments": {
    "scenarios": ["all"]
  }
}
```

### Export Results

```bash
{
  "tool": "export_results",
  "arguments": {
    "format": "html",
    "filepath": "./test_results.html",
    "includeDetails": true
  }
}
```

## Metrics Collected

The server tracks comprehensive metrics for each test:

- **Response Time**: Total time from request to response completion
- **Token Usage**: Estimated tokens consumed (input + output)
- **Cost Estimation**: Calculated cost based on Groq pricing for llama-3.1-8b-instant
- **Dataset Size**: Number of dataset elements in the response
- **MCP Calls**: Count of MCP tool invocations
- **URLs Fetched**: Unique Discovery Intech URLs accessed
- **Success Rate**: Test completion status

## Cost Calculation

Costs are calculated using Groq pricing for llama-3.1-8b-instant:
- Input tokens: $0.05 per 1,000 tokens
- Output tokens: $0.08 per 1,000 tokens
- Token estimation: ~4 characters per token

## Configuration

### Target URL Configuration

By default, the server targets `http://localhost:8072`. You can override this in any tool call:

```json
{
  "targetUrl": "https://your-discovery-client.com"
}
```

### Timeout Settings

All requests have a 5-minute timeout (300,000ms) to accommodate complex queries that may require extensive dataset generation.

## Error Handling

The server includes comprehensive error handling:
- Network timeouts and connection errors
- Invalid responses from the target client
- File system errors during export operations
- Invalid tool parameters

## Development

### Building

```bash
npm run build
```

### Project Dependencies

- **@modelcontextprotocol/sdk**: MCP framework
- **axios**: HTTP client for API requests
- **typescript**: TypeScript compiler and type definitions

### Adding New Test Scenarios

To add new benchmark scenarios, modify the `predefinedScenarios` object in the `benchmarkScenarios` method:

```typescript
const predefinedScenarios = {
  // existing scenarios...
  newScenario: 'Your new test query here',
};
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the Discovery Intech client is running on the specified URL
2. **Timeout Errors**: Large dataset queries may take several minutes to complete
3. **Permission Errors**: Ensure write permissions for export file paths

### Debug Mode

The server logs to stderr for debugging purposes. Monitor the console output for detailed execution information.

## License

ISC License

## Contributing

This is a specialized testing tool for Discovery Intech MCP clients. Ensure any modifications maintain compatibility with the MCP protocol specification.

## Support

For issues related to:
- MCP protocol: Check the Model Context Protocol documentation
- Discovery Intech client: Contact the Discovery Intech development team
- Server functionality: Review the source code in `src/index.ts`