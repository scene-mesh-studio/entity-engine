// src/utils/compression.ts

import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

// 将 zlib 的回调函数 Promise 化
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * 压缩 JSON 对象并编码为 Base64 字符串
 * @param data - 任何可以被 JSON.stringify 的对象
 * @returns 返回一个包含压缩后 Base64 字符串的 Promise
 */
export async function compressAndEncode(data: unknown): Promise<string> {
  // 1. 将对象转换为 JSON 字符串
  const jsonString = JSON.stringify(data);

  // 2. 使用 gzip 压缩 JSON 字符串，得到一个 Buffer
  const compressedBuffer = await gzipAsync(jsonString);

  // 3. 将压缩后的二进制 Buffer 编码为 Base64 字符串
  return compressedBuffer.toString('base64');
}

/**
 * 解码 Base64 字符串并解压为原始对象
 * @param encodedString - 经过 compressAndEncode 处理的 Base64 字符串
 * @returns 返回一个包含原始对象的 Promise，建议使用类型断言或 Zod/Joi 等库进行校验
 */
export async function decodeAndDecompress<T>(encodedString: string): Promise<T> {
  // 1. 将 Base64 字符串解码为二进制 Buffer
  const compressedBuffer = Buffer.from(encodedString, 'base64');

  // 2. 使用 gunzip 解压 Buffer
  const decompressedBuffer = await gunzipAsync(compressedBuffer);

  // 3. 将解压后的 Buffer 转换回 UTF-8 字符串
  const jsonString = decompressedBuffer.toString('utf8');

  // 4. 将 JSON 字符串解析为对象
  return JSON.parse(jsonString) as T;
}
