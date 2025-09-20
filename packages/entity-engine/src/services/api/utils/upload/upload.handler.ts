import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import { createId } from '@paralleldrive/cuid2';

/**
 * 上传文件
 */
export async function fetchEntityUploadHandler(req: Request) {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
        return new Response('Invalid content type', { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
        return new Response('File not found in form data', { status: 400 });
    }

    const modelName = formData.get('modelName') as string | 'default';
    // 确保上传目录存在
    const uploadDir = join(process.cwd(), `public/uploads/${modelName}`);
    if (!existsSync(uploadDir)) {
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create upload directory:', error);
            return new Response('Server error', { status: 500 });
        }
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    const serverFileName = createId() + '.' + file.name.split('.').pop();
    const filePath = join(uploadDir, serverFileName);

    try {
        writeFileSync(filePath, Buffer.from(fileBuffer));
    } catch (error) {
        console.error('Failed to save file:', error);
        return new Response('Failed to save file', { status: 500 });
    }

    const fileInfo = {
        fileName,
        fileType,
        fileSize,
        filePath: `${modelName}/${serverFileName}`,
    };

    return new Response(
        JSON.stringify({
            ...fileInfo,
            success: true,
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}
