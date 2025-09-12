import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Check if environment variables are set
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET',
      SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || 'NOT SET',
      SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD ? 'SET' : 'NOT SET',
    };

    // Try to create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'hello@hexen.in',
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    let connectionTest = 'NOT TESTED';
    if (process.env.SMTP_PASSWORD) {
      try {
        await transporter.verify();
        connectionTest = 'SUCCESS';
      } catch (error) {
        connectionTest = `FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    return NextResponse.json({
      status: 'Email Service Test',
      environmentVariables: envCheck,
      connectionTest,
      message: process.env.SMTP_PASSWORD 
        ? 'SMTP configured - testing connection' 
        : 'SMTP not configured - please add SMTP_PASSWORD to .env.local'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}