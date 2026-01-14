import crypto from 'crypto';

/**
 * Generate DoorDash API signature for authentication
 */
export function generateDoorDashSignature(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  signingSecret: string
): string {
  const message = `${timestamp}${method.toUpperCase()}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(message)
    .digest('hex');
  
  return signature;
}

/**
 * Create DoorDash API headers with proper authentication
 */
export function createDoorDashHeaders(
  developerId: string,
  keyId: string,
  signingSecret: string,
  method: string,
  path: string,
  body: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateDoorDashSignature(method, path, body, timestamp, signingSecret);
  
  return {
    'Authorization': `Bearer ${developerId}`,
    'Content-Type': 'application/json',
    'X-DD-Signature': `Signature keyid="${keyId}",algorithm="hmac-sha256",signature="${signature}"`,
    'X-DD-Timestamp': timestamp.toString(),
  };
}
