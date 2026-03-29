// src/api/artisan/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Product from '../../../../models/product.model';
import * as jose from 'jose';

// GET all products for the logged-in artisan
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const artisanId = payload.userId as string;

    if (!artisanId) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Artisan ID not found in token' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }

    const products = await Product.find({ artisan: artisanId });

    return new NextResponse(
      JSON.stringify({ success: true, products }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }
    
    console.error('Error fetching products:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}


// POST a new product for the logged-in artisan
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const artisanId = payload.userId as string;

    if (!artisanId) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Artisan ID not found in token' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }

    const body = await request.json();
    const { name, description, price, images, category, stock } = body;

    if (!name || !description || !price || !images || !category || !stock) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const newProduct = new Product({
      name,
      description,
      price,
      images,
      category,
      stock,
      artisan: artisanId,
    });

    await newProduct.save();

    return new NextResponse(
      JSON.stringify({ success: true, product: newProduct }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }
    
    console.error('Error creating product:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}