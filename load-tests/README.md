# Load Testing with Artillery

This directory contains load testing configurations for the Distributed Task Queue System using Artillery.

## Installation

### Install Artillery Globally

```bash
npm install -g artillery
```

Or install as a dev dependency (if network allows):

```bash
npm install --save-dev artillery
```

## Running Load Tests

### Prerequisites

1. Ensure the application is running:
```bash
npm run dev
```

2. Ensure Redis is running and accessible.

3. Ensure the application is listening on `http://localhost:3000`

### Run Load Tests

Using the npm script (if Artillery is installed as dev dependency):
```bash
npm run loadtest
```

Or using Artillery directly (if installed globally):
```bash
artillery run load-tests/notification-load-test.yml
```

### Run with JSON Report Export

```bash
artillery run load-tests/notification-load-test.yml --output report.json
```

### Run with HTML Report

```bash
artillery run load-tests/notification-load-test.yml --output report.json
artillery report report.json --output report.html
```

## Test Configuration

The `notification-load-test.yml` file defines two load testing scenarios:

### Scenario 1: Light Load
- **Duration**: 30 seconds
- **Virtual Users**: 50 per second
- **Total Requests**: ~1,500 requests

### Scenario 2: Heavy Load
- **Duration**: 60 seconds
- **Virtual Users**: 100 per second
- **Total Requests**: ~6,000 requests

### Total Test Duration
- **90 seconds** (30s + 60s)
- **Total Requests**: ~7,500 requests

## Test Payload

Each request generates a unique notification job with:
- **Type**: email
- **Recipient**: `user{{randomNumber}}@example.com` (unique email per request)
- **Subject**: "Load Test Notification"
- **Message**: "This is a load test notification"

The `{{$randomNumber()}}` helper generates a random number for each request, ensuring unique email addresses and avoiding idempotency conflicts.

## Metrics Measured

Artillery automatically measures and reports:

### Latency Metrics
- **Average Latency**: Mean response time across all requests
- **Median Latency**: 50th percentile response time
- **95th Percentile Latency**: 95% of requests complete within this time
- **99th Percentile Latency**: 99% of requests complete within this time

### Throughput Metrics
- **Request Rate**: Requests per second
- **Successful Requests**: Count of successful HTTP responses (2xx, 3xx)
- **Failed Requests**: Count of failed HTTP responses (4xx, 5xx)

### Additional Metrics
- **Response Time Distribution**: Breakdown of response times by percentile
- **Error Codes**: Distribution of HTTP error codes
- **Socket Errors**: Network-level errors

## Interpreting Results

### Sample Output

```
Scenarios launched:  7500
Scenarios completed: 7500
Scenarios cancelled: 0

Codes:
  201: 7500

Response time:
  min: 5
  max: 120
  median: 15
  p95: 25
  p99: 45

Scenario counts:
  Create Notification Jobs: 7500

Errors:
  None
```

### Key Indicators

**Healthy System**:
- 95th percentile latency < 100ms
- 99th percentile latency < 200ms
- Error rate < 1%
- Consistent response times

**Performance Issues**:
- 95th percentile latency > 500ms
- 99th percentile latency > 1000ms
- Error rate > 5%
- Increasing latency over time

**System Failure**:
- Error rate > 10%
- Many timeouts
- Connection errors

## Customizing Load Tests

### Adjust Load Levels

Edit `notification-load-test.yml`:

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - name: "Custom Load"
      duration: 60
      arrivalRate: 200  # Increase to 200 users/second
```

### Add More Scenarios

```yaml
scenarios:
  - name: "Create Notification Jobs"
    flow:
      - post:
          url: "/api/v1/jobs"
          json:
            type: "email"
            recipient: "user{{$randomNumber()}}@example.com"
            subject: "Load Test Notification"
            message: "This is a load test notification"
          headers:
            Content-Type: "application/json"
  
  - name: "Get Metrics"
    flow:
      - get:
          url: "/api/v1/metrics"
```

### Test with Idempotency

```yaml
- post:
    url: "/api/v1/jobs"
    json:
      type: "email"
      recipient: "user{{$randomNumber()}}@example.com"
      subject: "Load Test Notification"
      message: "This is a load test notification"
    headers:
      Content-Type: "application/json"
      Idempotency-Key: "load-test-{{$randomNumber()}}"
```

## Troubleshooting

### Connection Refused
- Ensure the application is running on port 3000
- Check firewall settings

### High Error Rates
- Verify Redis is running
- Check application logs for errors
- Ensure queue processing is not overwhelmed

### Slow Response Times
- Check Redis performance
- Verify worker is processing jobs
- Check system resources (CPU, memory)

### Artillery Not Found
- Install Artillery globally: `npm install -g artillery`
- Or add as dev dependency: `npm install --save-dev artillery`

## Best Practices

1. **Run tests in a staging environment** before production
2. **Monitor system resources** during load tests
3. **Start with light loads** and gradually increase
4. **Analyze results** to identify bottlenecks
5. **Test with realistic payloads** that match production
6. **Run multiple iterations** to ensure consistency
7. **Document baseline performance** for comparison

## Additional Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Artillery GitHub](https://github.com/artilleryio/artillery)
- [Load Testing Best Practices](https://www.artillery.io/blog/guide-to-load-testing)
