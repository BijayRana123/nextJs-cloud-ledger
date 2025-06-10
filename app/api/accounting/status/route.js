import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getBook } from '@/lib/accounting';

export async function GET() {
  try {
    // Check MongoDB connection
    const mongoStatus = {
      connected: mongoose.connection.readyState === 1,
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      uri: mongoose.connection.host ? `${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}` : 'Not connected',
      connectionString: process.env.MONGODB_URI ? 
        `${process.env.MONGODB_URI.substring(0, 15)}...` : 
        'Not configured or missing',
      readyState: mongoose.connection.readyState
    };

    // Try a direct MongoDB connection test if not already connected
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('Testing direct MongoDB connection...');
        const uri = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        mongoStatus.directConnectionTest = {
          success: true,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        };
      } catch (connError) {
        mongoStatus.directConnectionTest = {
          success: false,
          error: connError.message,
          code: connError.code || 'unknown'
        };
      }
    }

    // Try to initialize Medici book
    let bookStatus = { initialized: false, error: null };
    try {
      const book = await getBook();
      bookStatus.initialized = !!book;
    } catch (error) {
      bookStatus.error = error.message;
    }

    // Check for models
    let modelsStatus = { journalModel: false, transactionModel: false };
    try {
      modelsStatus.journalModel = !!mongoose.model('Medici_Journal');
    } catch (e) {
      modelsStatus.journalModelError = e.message;
    }

    try {
      modelsStatus.transactionModel = !!mongoose.model('Medici_Transaction');
    } catch (e) {
      modelsStatus.transactionModelError = e.message;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      mongoStatus,
      bookStatus,
      modelsStatus
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Status check failed', message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 