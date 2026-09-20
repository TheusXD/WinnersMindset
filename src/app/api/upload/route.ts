import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'default';
    const relativePath = (formData.get('path') as string) || `${Date.now()}_${file?.name || 'file'}`;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/[bucket]/[path]
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket, path.dirname(relativePath));
    await fs.mkdir(uploadDir, { recursive: true });

    const fullFilePath = path.join(process.cwd(), 'public', 'uploads', bucket, relativePath);
    await fs.writeFile(fullFilePath, buffer);

    const publicUrl = `/uploads/${bucket}/${relativePath.replace(/\\/g, '/')}`;

    return NextResponse.json({
      success: true,
      path: relativePath,
      publicUrl,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar upload do arquivo.' },
      { status: 500 }
    );
  }
}
