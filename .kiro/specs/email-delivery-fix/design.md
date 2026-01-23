# Design Document: Email Delivery Fix

## Overview

This design addresses the email delivery failures in the Gretex Music Room backend by migrating from Hostinger SMTP to Resend. The solution maintains the existing nodemailer-based architecture while updating SMTP configuration to use Resend's more reliable service. This approach requires minimal code changes—primarily environment variable updates and enhanced error handling.

The migration leverages Resend's SMTP interface, which means we can continue using nodemailer without rewriting the email service. Resend offers better deliverability, no IP blocking issues, and a generous free tier (3,000 emails/month, 100 emails/day).

## Architecture

### Current Architecture

```
User Action (Signup/Password Reset/Payment)
    ↓
Backend Route Handler
    ↓
Service Layer (auth.service.js, razorpay.service.js)
    ↓
Email Utility (email.js)
    ↓
Nodemailer → Hostinger SMTP (smtp.hostinger.com:465)
    ↓
Email Delivery (FAILS - Connection Timeout)
```

### New Architecture

```
User Action (Signup/Password Reset/Payment)
    ↓
Backend Route Handler
    ↓
Service Layer (auth.service.js, razorpay.service.js)
    ↓
Email Utility (email.js) [Enhanced Error Handling]
    ↓
Nodemailer → Resend SMTP (smtp.resend.com:465)
    ↓
Email Delivery (SUCCESS)
```

### Key Changes

1. **SMTP Server**: Change from `smtp.hostinger.com` to `smtp.resend.com`
2. **Authentication**: Use Resend API key as SMTP password
3. **Username**: Use fixed value "resend"
4. **Error Handling**: Enhanced logging and graceful failure handling
5. **Configuration**: Environment variables updated on Render

## Components and Interfaces

### Email Service Module (`backend/src/utils/email.js`)

**Current Implementation:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

**Enhanced Implementation:**
```javascript
const nodemailer = require('nodemailer');

// Validate required environment variables
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[Email] Missing required environment variables: ${missingVars.join(', ')}`);
  throw new Error(`Email service configuration incomplete: ${missingVars.join(', ')} not set`);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: true, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 30000, // 30 seconds
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[Email] SMTP connection verification failed:', error.message);
  } else {
    console.log('[Email] SMTP server is ready to send emails');
  }
});
```

### Email Functions

#### 1. Send Verification Email

**Interface:**
```javascript
async function sendVerificationEmail(email, token)
```

**Parameters:**
- `email` (string): Recipient email address
- `token` (string): Verification token for the email verification link

**Returns:**
- `Promise<Object>`: Success object with messageId or error details

**Enhanced Implementation:**
```javascript
async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email - Gretex Music Room',
    html: `
      <h2>Welcome to Gretex Music Room!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Verification email sent successfully:', {
      messageId: info.messageId,
      recipient: email,
      timestamp: new Date().toISOString(),
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send verification email:', {
      error: error.message,
      recipient: email,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: error.message };
  }
}
```

#### 2. Send Password Reset Email

**Interface:**
```javascript
async function sendPasswordResetEmail(email, token)
```

**Parameters:**
- `email` (string): Recipient email address
- `token` (string): Password reset token

**Returns:**
- `Promise<Object>`: Success object with messageId or error details

**Enhanced Implementation:**
```javascript
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password - Gretex Music Room',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Password reset email sent successfully:', {
      messageId: info.messageId,
      recipient: email,
      timestamp: new Date().toISOString(),
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', {
      error: error.message,
      recipient: email,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: error.message };
  }
}
```

#### 3. Send Invoice Email

**Interface:**
```javascript
async function sendInvoiceEmail(email, invoiceData)
```

**Parameters:**
- `email` (string): Recipient email address
- `invoiceData` (Object): Invoice details including amount, items, transaction ID

**Returns:**
- `Promise<Object>`: Success object with messageId or error details

**Enhanced Implementation:**
```javascript
async function sendInvoiceEmail(email, invoiceData) {
  const { orderId, amount, items, transactionDate } = invoiceData;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invoice for Order ${orderId} - Gretex Music Room`,
    html: `
      <h2>Payment Confirmation</h2>
      <p>Thank you for your purchase!</p>
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Amount:</strong> ₹${amount}</p>
      <p><strong>Date:</strong> ${transactionDate}</p>
      <h3>Items Purchased</h3>
      <ul>
        ${items.map(item => `<li>${item.name} - ₹${item.price}</li>`).join('')}
      </ul>
      <p>If you have any questions, please contact our support team.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Invoice email sent successfully:', {
      messageId: info.messageId,
      recipient: email,
      orderId: orderId,
      timestamp: new Date().toISOString(),
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send invoice email:', {
      error: error.message,
      recipient: email,
      orderId: orderId,
      timestamp: new Date().toISOString(),
    });
    // Don't fail the payment flow if invoice email fails
    return { success: false, error: error.message };
  }
}
```

### Environment Variables Configuration

**Required Variables on Render:**

| Variable | Value | Description |
|----------|-------|-------------|
| `SMTP_HOST` | `smtp.resend.com` | Resend SMTP server |
| `SMTP_PORT` | `465` | Secure SMTP port |
| `SMTP_USER` | `resend` | Fixed username for Resend |
| `SMTP_PASS` | `re_xxxxx` | Resend API key (obtained from Resend dashboard) |
| `EMAIL_FROM` | `onboarding@resend.dev` | Verified sender address (use Resend's test domain initially) |
| `FRONTEND_URL` | `https://gmusic-ivdh.onrender.com` | Frontend URL for email links |

**Setup Steps:**

1. Sign up for Resend account at https://resend.com
2. Generate API key from Resend dashboard
3. Update environment variables in Render dashboard
4. Restart the backend service on Render
5. Test email delivery with a verification email

## Data Models

### Email Result Object

```javascript
{
  success: boolean,      // Whether email was sent successfully
  messageId: string,     // Unique message ID from email provider (on success)
  error: string          // Error message (on failure)
}
```

### Invoice Data Object

```javascript
{
  orderId: string,           // Unique order identifier
  amount: number,            // Total amount in rupees
  items: Array<{             // List of purchased items
    name: string,
    price: number
  }>,
  transactionDate: string    // ISO 8601 formatted date
}
```

### Email Log Entry

```javascript
{
  messageId: string,         // Unique message ID
  recipient: string,         // Email recipient
  timestamp: string,         // ISO 8601 formatted timestamp
  type: string,              // 'verification' | 'password-reset' | 'invoice'
  status: string,            // 'success' | 'failure'
  error: string              // Error message (if failed)
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Email Function Interface Compatibility

*For any* valid email address and token/invoice data, calling the email functions (sendVerificationEmail, sendPasswordResetEmail, sendInvoiceEmail) should return a result object with the same structure as the original implementation (containing success boolean and either messageId or error).

**Validates: Requirements 1.5**

### Property 2: Email Delivery Timing

*For any* valid email parameters (email address, token, or invoice data), the email sending function should complete (either successfully or with an error) within the specified time limit (5 seconds for verification/password reset, 10 seconds for invoices, 30 seconds maximum for any timeout scenario).

**Validates: Requirements 2.1, 3.1, 4.1, 5.4**

### Property 3: Email Content Validation

*For any* valid email address and token, the generated email HTML should contain a properly formatted URL that includes the token parameter and the correct base URL from environment variables.

**Validates: Requirements 2.2, 3.2**

### Property 4: Invoice Email Content Completeness

*For any* valid invoice data object, the generated invoice email HTML should contain all required fields: orderId, amount, transactionDate, and all items from the items array.

**Validates: Requirements 4.2, 4.5**

### Property 5: Error Logging Completeness

*For any* email sending failure, the error log should contain all required fields: error message, recipient email address, timestamp in ISO 8601 format, and the type of email being sent.

**Validates: Requirements 2.3, 3.3, 5.1**

### Property 6: Success Response Format

*For any* successful email delivery, the function should return an object with success=true and a messageId field, and should log an entry containing the messageId, recipient, and timestamp.

**Validates: Requirements 2.4, 7.4, 7.5**

### Property 7: Graceful Error Handling

*For any* email sending failure (connection timeout, authentication failure, invalid recipient), the email function should return an error object rather than throwing an unhandled exception.

**Validates: Requirements 5.2, 4.3**

### Property 8: Error Message Clarity

*For any* error scenario (configuration error vs. delivery error), the error message should clearly indicate the type of error and provide actionable information for debugging.

**Validates: Requirements 5.5**

### Property 9: Configuration Validation

*For any* missing required environment variable (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM), the email service initialization should log an error message that specifically names which variable is missing.

**Validates: Requirements 6.2**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing environment variables
   - Invalid port number
   - Missing or invalid EMAIL_FROM address
   - **Handling**: Fail fast on startup with clear error messages

2. **Connection Errors**
   - SMTP server unreachable
   - Authentication failure
   - Connection timeout
   - **Handling**: Log detailed error, return error object, don't crash application

3. **Delivery Errors**
   - Invalid recipient email address
   - Email rejected by server
   - Rate limiting
   - **Handling**: Log error with recipient details, return error object

4. **Timeout Errors**
   - Connection timeout (10 seconds)
   - Socket timeout (30 seconds)
   - **Handling**: Fail gracefully, log timeout details, return error object

### Error Response Format

All email functions return a consistent error format:

```javascript
{
  success: false,
  error: "Descriptive error message including error type and details"
}
```

### Error Logging Format

All errors are logged with structured information:

```javascript
console.error('[Email] Failed to send {email_type} email:', {
  error: error.message,
  recipient: email,
  timestamp: new Date().toISOString(),
  additionalContext: {...}
});
```

### Critical vs. Non-Critical Failures

- **Critical**: Verification emails and password reset emails should be logged as errors but allow the user flow to continue (user can request resend)
- **Non-Critical**: Invoice emails should never block payment completion; log errors but don't fail the transaction

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**
   - Sending a verification email with a known token
   - Sending a password reset email with a known token
   - Sending an invoice email with sample invoice data
   - Verifying SMTP connection on startup

2. **Edge Cases**
   - Empty email address
   - Malformed email address
   - Missing token
   - Missing invoice data fields
   - Very long email addresses
   - Special characters in email addresses

3. **Error Conditions**
   - Missing environment variables
   - Invalid SMTP credentials
   - Connection timeout simulation
   - SMTP server rejection

4. **Integration Points**
   - Email service initialization
   - Environment variable loading
   - Nodemailer transporter creation

### Property-Based Testing

Property-based tests should be implemented using a JavaScript PBT library (such as fast-check for Node.js). Each test should:

- Run a minimum of 100 iterations
- Generate random valid inputs
- Verify the corresponding correctness property
- Include a comment tag referencing the design property

**Test Configuration:**
```javascript
// Example using fast-check
const fc = require('fast-check');

// Feature: email-delivery-fix, Property 1: Email Function Interface Compatibility
fc.assert(
  fc.property(
    fc.emailAddress(),
    fc.string(),
    async (email, token) => {
      const result = await sendVerificationEmail(email, token);
      return (
        typeof result === 'object' &&
        typeof result.success === 'boolean' &&
        (result.success ? typeof result.messageId === 'string' : typeof result.error === 'string')
      );
    }
  ),
  { numRuns: 100 }
);
```

**Property Test Coverage:**

1. **Property 1**: Generate random email addresses and tokens, verify return structure
2. **Property 2**: Generate random inputs, verify completion time
3. **Property 3**: Generate random tokens, verify URL format in email HTML
4. **Property 4**: Generate random invoice data, verify all fields present in email
5. **Property 5**: Simulate failures, verify error log structure
6. **Property 6**: Generate random inputs, verify success response format
7. **Property 7**: Simulate various failure scenarios, verify no exceptions thrown
8. **Property 8**: Generate different error types, verify error message clarity
9. **Property 9**: Test with various missing environment variables, verify error messages

### Testing Environment

- **Local Testing**: Use Resend's test domain (onboarding@resend.dev) for development
- **Staging Testing**: Use Resend's test domain before domain verification
- **Production Testing**: Use verified custom domain after DNS setup

### Manual Verification Steps

After deployment:

1. Trigger a signup flow and verify verification email arrives
2. Trigger a password reset and verify reset email arrives
3. Complete a payment and verify invoice email arrives
4. Check Render logs for successful email delivery logs
5. Check Resend dashboard for email delivery statistics
6. Verify email delivery time is within acceptable limits

### Monitoring and Observability

- Log all email sending attempts with timestamps
- Log all failures with detailed error information
- Monitor email delivery success rate
- Set up alerts for repeated email failures
- Use Resend dashboard for delivery analytics
