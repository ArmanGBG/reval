# OTP Guide — Adding OTP to a New Project

Use this guide when an agent needs to add phone-based OTP (one-time password) to a new project, modeled after the existing OTP + Arta SMS implementation in this codebase.

## Overview

The existing OTP system is composed of three layers:

1. **SMS provider adapters** (`src/lib/sms-*.ts`) — thin HTTP clients for each SMS vendor.
2. **Provider router** (`src/lib/sms.ts`) — selects the active provider via env var.
3. **OTP orchestration** (`src/lib/otp.ts`) — generates, stores, and verifies codes using Prisma.

## Step-by-Step

### 1. Create the OTP orchestration module

Create a file analogous to `src/lib/otp.ts`:

- Constants: `OTP_TTL_MS` (2 min), `OTP_COOLDOWN_MS` (60 s), `OTP_MAX_ATTEMPTS` (5).
- `requestOtp(phone, purpose)`:
  - Check cooldown by querying the latest challenge for `(phone, purpose)`.
  - Generate a 6-digit code with `crypto.randomInt(100000, 1000000).toString()`.
  - Store `codeHash` using `bcrypt.hash(code, 10)` and `expiresAt`.
  - Call `sendOtpSms(phone, code)`.
  - On SMS failure, delete the stored challenge and rethrow.
- `verifyOtp(phone, purpose, code)`:
  - Find the latest unconsumed challenge for `(phone, purpose)`.
  - Reject if missing, expired, or `attempts >= OTP_MAX_ATTEMPTS`.
  - `bcrypt.compare(code, challenge.codeHash)`.
  - On mismatch, increment `attempts` and return `false`.
  - On match, set `consumedAt` and return `true`.

### 2. Create an SMS provider adapter

Create a file analogous to `src/lib/sms-arta.ts` (or `sms-ir.ts`):

- Export a `sendVerification(phone, code)` function.
- Read credentials/patterns from environment variables.
- Throw a descriptive error (e.g. `ARTA_SMS_NOT_CONFIGURED`) if env vars are missing.
- Use `fetch` with the vendor's API endpoint, appropriate headers, and `AbortSignal.timeout(10_000)`.
- Validate the response; throw on failure.

### 3. Create the provider router

Create a file analogous to `src/lib/sms.ts`:

- Define a `SmsProvider` union type (e.g. `'sandbox' | 'sms_ir' | 'arta'`).
- `getSmsProvider()` reads `SMS_PROVIDER` env var; falls back to legacy setting if present; throws on unknown values.
- `isSmsSandbox()` returns true when provider is `sandbox`.
- `sendOtpSms(phone, code)`:
  - `sandbox` → no-op.
  - Otherwise → call the selected provider's `sendVerification`.

### 4. Wire up the database model

Add a Prisma model `otpChallenge` with fields:
- `id` (String, `@default(cuid())`)
- `phone` (String)
- `purpose` (String, e.g. `LOGIN` / `SIGNUP`)
- `codeHash` (String)
- `expiresAt` (DateTime)
- `attempts` (Int, default 0)
- `consumedAt` (DateTime, nullable)
- `createdAt` (DateTime, `@default(now())`)

Add indexes on `(phone, purpose)` and `consumedAt` for cleanup queries.

### 5. Configure environment variables

Document these env vars for each provider:

| Provider     | Token/API Key        | Pattern/Template ID     | From Number        | Parameter Name        |
|--------------|----------------------|-------------------------|--------------------|-----------------------|
| Arta         | `ARTA_SMS_API_TOKEN` | `ARTA_SMS_PATTERN_CODE` | `ARTA_SMS_FROM_NUMBER` | `ARTA_SMS_OTP_PARAMETER` |
| SMS.ir       | `SMS_IR_API_KEY`     | `SMS_IR_OTP_TEMPLATE_ID` | (not used)         | `SMS_IR_OTP_PARAMETER` |
| General      | `SMS_PROVIDER`       |                         |                    |                       |

Set `SMS_PROVIDER=sandbox` for local development/testing.

### 6. Write tests

Add tests in `src/__tests__/`:

- Provider selection: explicit values, legacy fallback, unknown rejection, sandbox no-op.
- Provider adapter: phone normalization, payload shape, configuration-missing error.
- OTP orchestration: cooldown enforcement, code generation, verification success/failure, expiry, max attempts.

Use `vitest` with `vi.spyOn(globalThis, 'fetch')` to mock HTTP calls.

### 7. Integrate into auth flow

- Call `requestOtp(phone, 'LOGIN' | 'SIGNUP')` from the request-code endpoint.
- Call `verifyOtp(phone, purpose, code)` from the verify endpoint.
- On successful verification, issue a session token or mark the phone as verified in the user record.

## Key Conventions

- Iranian phone numbers are canonicalized to `09XXXXXXXXX` (11 digits starting with `09`) before storage.
- Arta adapter converts to E.164 (`+989...`) by stripping the leading `0`.
- Codes are never stored in plaintext; only bcrypt hashes are persisted.
- Cooldown and max-attempt checks prevent brute force and spam.
- All SMS sending is wrapped in try/catch so a provider failure rolls back the stored challenge.

## References in This Codebase

- OTP orchestration: `src/lib/otp.ts`
- Arta adapter: `src/lib/sms-arta.ts`
- SMS.ir adapter: `src/lib/sms-ir.ts`
- Provider router: `src/lib/sms.ts`
- SMS tests: `src/__tests__/sms.test.ts`