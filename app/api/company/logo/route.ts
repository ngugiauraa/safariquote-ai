import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to upload logo';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const organizationId = formData.get('organizationId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing logo file' }, { status: 400 });
    }

    if (typeof organizationId !== 'string' || !organizationId) {
      return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    const fileName = `${organizationId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(fileName, fileBytes, {
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabaseAdmin.storage.from('logos').getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      publicUrl: data.publicUrl,
    });
  } catch (error: unknown) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
