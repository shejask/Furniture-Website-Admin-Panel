import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Shiprocket environment variables are set
    const envCheck = {
      SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || 'NOT SET',
      SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD ? 'SET' : 'NOT SET',
      SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'NOT SET',
    };

    // Test Shiprocket authentication with hardcoded credentials for testing
    let authTest = 'NOT TESTED';
    const shiprocketEmail = process.env.SHIPROCKET_EMAIL || 'hexenwebcreators@gmail.com';
    const shiprocketPassword = process.env.SHIPROCKET_PASSWORD || '9qjGFe7u^hGlqii%';
    
    try {
      const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: shiprocketEmail,
          password: shiprocketPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        authTest = data.token ? 'SUCCESS - Token received' : 'FAILED - No token in response';
      } else {
        const errorText = await response.text();
        authTest = `FAILED - HTTP ${response.status}: ${errorText}`;
      }
    } catch (error) {
      authTest = `FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: 'Shiprocket Service Test',
      environmentVariables: envCheck,
      authenticationTest: authTest,
      message: (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD)
        ? 'Shiprocket configured - testing authentication' 
        : 'Shiprocket not configured - please add credentials to .env.local'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
