# Design Document: Render Deployment Fix

## Overview

This design establishes a robust startup validation system for the Express.js backend deployed on Render with Supabase PostgreSQL. The solution implements fail-fast validation patterns to detect configuration issues before the server accepts traffic, comprehensive health monitoring for operational visibility, and detailed documentation to prevent recurring deployment failures.

The design follows a layered validation approach:
1. **Pre-startup validation**: Environment variables and connection string format
2. **Connection validation**: Database connectivity and query execution
3. **Runtime monitoring**: Health check endpoint for continuous verification
4. **Operational documentation**: Deployment guides and troubleshooting procedures

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Server Startup Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Environment Validator                                    │
│     ├─ Validate required variables                          │
│     ├─ Validate DATABASE_URL format                         │
│     └─ Mask sensitive data in logs                          │
│                                                               │
│  2. Database Connection Validator                            │
│     ├─ Establish Prisma connection                          │
│     ├─ Execute test query                                   │
│     └─ Log connection details                               │
│                                                               │
│  3. HTTP Server Initialization                               │
│     ├─ Mount routes (including /health)                     │
│     ├─ Start listening on port                              │
│     └─ Log "Server ready" message                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Health Check Endpoint                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  GET /health                                                 │
│     ├─ Execute lightweight DB query                         │
│     ├─ Measure response time                                │
│     └─ Return status + metrics                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Validation Flow

```mermaid
graph TD
    A[Server Start] --> B[Load Environment Variables]
    B --> C{All Required<br/>Variables Present?}
    C -->|No| D[Log Missing Variables]
    D --> E[Exit Code 1]
    C -->|Yes| F{DATABASE_URL<br/>Format Valid?}
    F -->|No| G[Log Format Error]
    G --> E
    F -->|Yes| H[Initialize Prisma]
    H --> I{Database<br/>Connection OK?}
    I -->|No| J[Log Connection Error]
    J --> E
    I -->|Yes| K[Execute Test Query]
    K --> L{Query<br/>Successful?}
    L -->|No| M[Log Query Error]
    M --> E
    L -->|Yes| N[Start HTTP Server]
    N --> O[Log Server Ready]
    O --> P[Accept Requests]
```

## Components and Interfaces

### 1. Environment Validator Module

**File**: `backend/src/utils/envValidator.js`

**Purpose**: Validates all required environment variables and DATABASE_URL format before server startup.

**Interface**:
```javascript
/**
 * Validates all required environment variables
 * @throws {Error} If validation fails with descriptive message
 * @returns {void}
 */
function validateEnvironment()

/**
 * Validates DATABASE_URL format and components
 * @param {string} databaseUrl - The DATABASE_URL to validate
 * @throws {Error} If format is invalid
 * @returns {Object} Parsed connection components (masked)
 */
function validateDatabaseUrl(databaseUrl)

/**
 * Masks sensitive data in connection strings for logging
 * @param {string} connectionString - The connection string to mask
 * @returns {string} Masked connection string
 */
function maskSensitiveData(connectionString)
```

**Required Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `PORT` - Server port (defaults to 3000)
- `NODE_ENV` - Environment (development/production)
- Additional variables as needed by the application

**DATABASE_URL Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?[params]
```

For Supabase connection pooling:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Validation Logic**:
1. Check each required variable exists in `process.env`
2. Parse DATABASE_URL using URL constructor
3. Verify protocol is `postgresql://` or `postgres://`
4. Verify username, password, host, and database components exist
5. Log masked connection details for debugging

### 2. Database Connection Validator Module

**File**: `backend/src/utils/dbValidator.js`

**Purpose**: Tests database connectivity and executes validation queries before server startup.

**Interface**:
```javascript
/**
 * Tests database connection and executes validation query
 * @param {PrismaClient} prisma - Prisma client instance
 * @throws {Error} If connection or query fails
 * @returns {Promise<Object>} Connection details and metrics
 */
async function validateDatabaseConnection(prisma)

/**
 * Categorizes database errors for better diagnostics
 * @param {Error} error - The database error
 * @returns {Object} Categorized error with suggestions
 */
function categorizeDatabaseError(error)
```

**Test Query**:
```sql
SELECT 1 as health_check
```

**Error Categorization**:
- **Authentication Error**: "password authentication failed", "Tenant or user not found"
  - Suggestion: Verify DATABASE_URL credentials and format
- **Network Error**: "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"
  - Suggestion: Check network connectivity and firewall rules
- **Configuration Error**: "database does not exist", "invalid connection string"
  - Suggestion: Verify DATABASE_URL format and database name

**Connection Details Logged**:
- Database host (masked)
- Database name
- Connection pool status
- Query execution time
- Prisma version

### 3. Health Check Endpoint

**File**: `backend/src/routes/health.routes.js`

**Purpose**: Provides runtime health monitoring for database connectivity.

**Endpoint**: `GET /health`

**Response Format**:
```javascript
// Success (200 OK)
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "connected": true,
    "responseTime": 45  // milliseconds
  },
  "uptime": 3600  // seconds
}

// Failure (503 Service Unavailable)
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "connected": false,
    "error": "Connection timeout",
    "responseTime": null
  },
  "uptime": 3600
}
```

**Implementation**:
```javascript
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Execute lightweight query
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime
      },
      uptime: process.uptime()
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message,
        responseTime
      },
      uptime: process.uptime()
    });
  }
});
```

### 4. Enhanced Server Startup

**File**: `backend/src/server.js` (modifications)

**Startup Sequence**:
```javascript
async function startServer() {
  try {
    console.log('🔍 Validating environment variables...');
    validateEnvironment();
    console.log('✅ Environment variables validated');
    
    console.log('🔍 Testing database connection...');
    const dbDetails = await validateDatabaseConnection(prisma);
    console.log('✅ Database connection successful:', dbDetails);
    
    console.log('🚀 Starting HTTP server...');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server ready on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startServer();
```

## Data Models

No new database models are required. This feature works with existing Prisma schema and uses the Prisma client for connection validation.

**Prisma Client Usage**:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty'
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Environment Variable Validation Completeness

*For any* set of environment variables, when required variables are missing, the Environment_Validator should throw an error that identifies all missing variable names and prevent server startup.

**Validates: Requirements 1.1, 1.2, 1.3, 4.1**

### Property 2: DATABASE_URL Format Validation

*For any* connection string, the Environment_Validator should correctly identify whether it contains all required PostgreSQL components (protocol, username, password, host, port, database) and provide specific error messages for missing components.

**Validates: Requirements 1.4, 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 3: Credential Masking Consistency

*For any* connection string containing credentials, the masking function should replace password values with asterisks while preserving the connection string structure for debugging.

**Validates: Requirements 4.5**

### Property 4: Database Error Categorization

*For any* database error, the error categorization function should correctly classify it as authentication, network, or configuration error and provide appropriate troubleshooting suggestions.

**Validates: Requirements 4.2**

### Property 5: Health Check Response Structure

*For any* health check request, the response should include all required fields (status, timestamp, database connection state, responseTime, uptime) regardless of whether the database is healthy or unhealthy.

**Validates: Requirements 3.5**

### Property 6: Startup Failure Error Reporting

*For any* validation failure during startup, the system should log all validation errors with descriptive messages before throwing an error that would cause process exit.

**Validates: Requirements 8.1, 8.3**

## Error Handling

### Error Categories and Responses

**1. Missing Environment Variables**
```javascript
Error: Missing required environment variables: DATABASE_URL, JWT_SECRET
Expected variables:
  - DATABASE_URL: PostgreSQL connection string
  - JWT_SECRET: Secret key for JWT signing
  - PORT: Server port (optional, defaults to 3000)
  - NODE_ENV: Environment (development/production)
```

**2. Invalid DATABASE_URL Format**
```javascript
Error: Invalid DATABASE_URL format
Current: mysql://user:pass@host/db
Expected: postgresql://[user]:[password]@[host]:[port]/[database]

Missing components:
  - Protocol must be 'postgresql://' or 'postgres://'

For Supabase connection pooling, use:
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**3. Database Connection Failures**

**Authentication Error:**
```javascript
Error: Database authentication failed
Message: password authentication failed for user "postgres"
Category: Authentication Error

Suggestions:
  ✓ Verify DATABASE_URL credentials are correct
  ✓ Check that password doesn't contain special characters that need URL encoding
  ✓ Ensure you're using the correct Supabase project password
  ✓ For Supabase, verify you're using the connection pooling URL (port 6543)
```

**Network Error:**
```javascript
Error: Database connection failed
Message: connect ETIMEDOUT
Category: Network Error

Suggestions:
  ✓ Check network connectivity to database host
  ✓ Verify firewall rules allow outbound connections on port 6543
  ✓ Ensure Render's IP is whitelisted in Supabase (if IP restrictions enabled)
  ✓ Check if database host is reachable: aws-0-us-east-1.pooler.supabase.com
```

**Configuration Error:**
```javascript
Error: Database configuration invalid
Message: database "wrong_db" does not exist
Category: Configuration Error

Suggestions:
  ✓ Verify database name in DATABASE_URL is correct
  ✓ Check that the database exists in Supabase
  ✓ Ensure DATABASE_URL matches your Supabase project settings
```

### Error Handling Strategy

**Startup Phase**:
- All validation errors are fatal and cause immediate process exit
- Errors are logged to console with full details
- Exit code 1 signals deployment failure to Render
- No HTTP server is started if validation fails

**Runtime Phase (Health Check)**:
- Database errors return HTTP 503 but don't crash the server
- Errors are logged for monitoring
- Response includes error details for debugging
- Server continues running to allow recovery

## Testing Strategy

This feature requires both unit tests and property-based tests to ensure comprehensive validation coverage.

### Unit Testing Approach

Unit tests will focus on:
- **Specific examples**: Testing with known valid/invalid environment configurations
- **Edge cases**: Empty strings, special characters in passwords, malformed URLs
- **Error conditions**: Specific database error messages and their categorization
- **Integration points**: Health check endpoint responses with mocked database

**Example Unit Tests**:
```javascript
describe('Environment Validator', () => {
  it('should accept valid complete environment', () => {
    // Test with all required variables present
  });
  
  it('should reject when DATABASE_URL is missing', () => {
    // Test specific missing variable
  });
  
  it('should handle special characters in password', () => {
    // Edge case: URL encoding
  });
});

describe('Health Check Endpoint', () => {
  it('should return 200 when database is healthy', () => {
    // Mock successful database query
  });
  
  it('should return 503 when database is down', () => {
    // Mock failed database query
  });
});
```

### Property-Based Testing Approach

Property-based tests will verify universal properties across many generated inputs using a library like **fast-check** (for JavaScript/Node.js).

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: render-deployment-fix, Property {N}: {property text}`

**Property Test Examples**:
```javascript
const fc = require('fast-check');

describe('Property Tests: Environment Validation', () => {
  // Feature: render-deployment-fix, Property 1: Environment Variable Validation Completeness
  it('should identify all missing required variables', () => {
    fc.assert(
      fc.property(
        fc.record({
          DATABASE_URL: fc.option(fc.string()),
          JWT_SECRET: fc.option(fc.string()),
          PORT: fc.option(fc.nat()),
          NODE_ENV: fc.option(fc.constantFrom('development', 'production'))
        }),
        (env) => {
          const missing = [];
          if (!env.DATABASE_URL) missing.push('DATABASE_URL');
          if (!env.JWT_SECRET) missing.push('JWT_SECRET');
          
          if (missing.length > 0) {
            try {
              validateEnvironment(env);
              return false; // Should have thrown
            } catch (error) {
              // Verify all missing variables are in error message
              return missing.every(v => error.message.includes(v));
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: render-deployment-fix, Property 2: DATABASE_URL Format Validation
  it('should validate all DATABASE_URL components', () => {
    fc.assert(
      fc.property(
        fc.record({
          protocol: fc.constantFrom('postgresql://', 'postgres://', 'mysql://', 'http://'),
          username: fc.option(fc.string()),
          password: fc.option(fc.string()),
          host: fc.option(fc.domain()),
          port: fc.option(fc.nat(65535)),
          database: fc.option(fc.string())
        }),
        (components) => {
          const url = buildConnectionString(components);
          const isValid = 
            (components.protocol === 'postgresql://' || components.protocol === 'postgres://') &&
            components.username &&
            components.password &&
            components.host &&
            components.database;
          
          try {
            validateDatabaseUrl(url);
            return isValid; // Should only succeed if valid
          } catch (error) {
            return !isValid; // Should only fail if invalid
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: render-deployment-fix, Property 3: Credential Masking Consistency
  it('should mask passwords while preserving structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (username, password) => {
          const url = `postgresql://${username}:${password}@host:5432/db`;
          const masked = maskSensitiveData(url);
          
          // Password should be masked
          const passwordMasked = !masked.includes(password);
          // Username should be preserved
          const usernamePreserved = masked.includes(username);
          // Structure should be preserved
          const structurePreserved = masked.includes('@host:5432/db');
          
          return passwordMasked && usernamePreserved && structurePreserved;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Testing Coverage Goals

- **Unit Tests**: 80%+ code coverage for validation modules
- **Property Tests**: All 6 correctness properties implemented
- **Integration Tests**: Health check endpoint with real database connection
- **Manual Tests**: Deployment verification on Render staging environment

### Test Execution

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only property tests
npm run test:property

# Run with coverage
npm run test:coverage
```

## Documentation Deliverables

### 1. Render Deployment Guide

**File**: `docs/RENDER_DEPLOYMENT.md`

**Contents**:
- Step-by-step Render setup instructions
- Environment variable configuration with screenshots
- DATABASE_URL format explanation
- Supabase connection pooling setup
- Deployment verification steps
- Health check endpoint usage

### 2. Troubleshooting Guide

**File**: `docs/DEPLOYMENT_TROUBLESHOOTING.md`

**Contents**:
- Common error messages and solutions
- "Tenant or user not found" resolution
- Connection timeout debugging
- Environment variable verification
- Render logs interpretation
- Rollback procedures

### 3. Deployment Checklist

**File**: `docs/DEPLOYMENT_CHECKLIST.md`

**Contents**:
- Pre-deployment verification steps
- Environment variable checklist
- DATABASE_URL validation steps
- Post-deployment verification
- Health check testing
- Monitoring setup

### 4. Environment Variables Reference

**File**: `docs/ENVIRONMENT_VARIABLES.md`

**Contents**:
- Complete list of required variables
- Description and purpose of each variable
- Example values (with placeholders)
- Supabase-specific configuration
- Security best practices

## Implementation Notes

### Render-Specific Considerations

1. **Environment Variables**: Set in Render Dashboard → Environment tab
2. **Build Command**: `npm install && npx prisma generate`
3. **Start Command**: `node src/server.js`
4. **Health Check Path**: Configure `/health` in Render settings
5. **Auto-Deploy**: Enable for automatic deployments on git push

### Supabase Connection Pooling

**Connection Pooler URL** (Port 6543):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection URL** (Port 5432):
```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Recommendation**: Use connection pooler (port 6543) for serverless/cloud deployments like Render to handle connection limits efficiently.

### Prisma Configuration

Ensure `prisma/schema.prisma` uses environment variable:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Logging Best Practices

- Use structured logging for easier parsing
- Include timestamps in all log messages
- Mask sensitive data (passwords, tokens)
- Log at appropriate levels (info, warn, error)
- Include context (function name, operation)

## Security Considerations

1. **Credential Masking**: Always mask passwords in logs
2. **Environment Variables**: Never commit `.env` files to git
3. **Error Messages**: Don't expose sensitive details in production errors
4. **Health Check**: Don't expose sensitive system information
5. **Database Access**: Use least-privilege database user
6. **Connection Strings**: Validate format to prevent injection

## Performance Considerations

1. **Startup Time**: Validation adds ~1-2 seconds to startup
2. **Health Check**: Lightweight query (<50ms typical response)
3. **Connection Pooling**: Supabase pooler handles connection reuse
4. **Error Handling**: Fast-fail approach prevents resource waste
5. **Logging**: Minimal performance impact with structured logging
