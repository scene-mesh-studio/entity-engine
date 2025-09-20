#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

const log = {
    info: (msg: string) => console.log(`\x1b[34m[info]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[success]\x1b[0m ${msg}`),
    error: (msg: string) => console.error(`\x1b[31m[error]\x1b[0m ${msg}`),
    warn: (msg: string) => console.warn(`\x1b[33m[warn]\x1b[0m ${msg}`),
};

async function runCommand(command: string) {
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        log.error(`Failed to execute command: ${command}`);
        throw error;
    }
}

async function main() {
    log.info('Setting up @scenemesh/entity-engine...');

    const userSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const packageSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    let generateCommand = 'npx prisma generate';

    // 检查用户的 schema 文件是否存在
    if (fs.existsSync(userSchemaPath)) {
        // --- 场景 1: 用户有 schema 文件，执行合并 ---
        log.info('Existing prisma/schema.prisma found. Merging models...');
        const existingSchema = fs.readFileSync(userSchemaPath, 'utf-8');
        if (existingSchema.includes('model EntityObject')) {
            log.info(
                'Entity Engine models already exist in your schema. Skipping schema modification.'
            );
        } else {
            let modelsToAdd = fs.readFileSync(packageSchemaPath, 'utf-8');
            const modelStartIndex = modelsToAdd.indexOf('model EntityObject');
            if (modelStartIndex !== -1) {
                modelsToAdd = '\n\n' + modelsToAdd.substring(modelStartIndex);
                fs.appendFileSync(userSchemaPath, modelsToAdd);
                log.success('Entity Engine models have been added to your prisma/schema.prisma.');
            }
        }
    } else {
        // --- 场景 2: 用户没有 schema 文件，直接使用包内 schema ---
        log.warn('No prisma/schema.prisma found in your project.');
        log.info('Generating a temporary Prisma Client based on the Entity Engine schema.');

        // 修改 generate 命令，指向包内的 schema
        generateCommand = `npx prisma generate --schema=${packageSchemaPath}`;
    }

    // --- 执行 prisma generate ---
    try {
        log.info(`Running command: ${generateCommand}`);
        await runCommand(generateCommand);
        log.success('Prisma Client has been successfully generated.');
    } catch {
        log.error('Prisma Client generation failed. Please run it manually.');
        process.exit(1);
    }

    // --- 指导用户进行下一步 ---
    if (fs.existsSync(userSchemaPath)) {
        log.info("Next step: Run 'npx prisma migrate dev' to update your database.");
        // 交互式询问是否现在执行 migrate
        await maybeRunInteractive(async () => {
            const doMigrate = await promptYesNo('是否现在执行数据库迁移以创建/更新表结构? (y/N): ');
            if (doMigrate) {
                try {
                    log.info('Running: npx prisma migrate dev');
                    await runCommand('npx prisma migrate dev');
                    log.success('数据库迁移已完成。');
                } catch (err) {
                    log.error('执行 prisma migrate dev 失败，请手动检查。');
                    if (err instanceof Error) log.error(err.message);
                }
            } else {
                log.info('已跳过数据库迁移。');
            }
        });
    } else {
        log.warn(
            'Important: The generated client is temporary and only contains Entity Engine models.'
        );
        log.warn(
            "Once you create your own 'prisma/schema.prisma' and run 'npx prisma generate', this client will be overwritten."
        );
        log.warn(
            "To integrate properly, run 'npx prisma init' and then run this setup script again."
        );
        // 交互式询问是否基于临时 schema 推送数据库结构
        await maybeRunInteractive(async () => {
            const doPush = await promptYesNo(
                '当前没有本地 schema，是否基于包内临时 schema 立即创建数据库结构 (prisma db push)? (y/N): '
            );
            if (doPush) {
                try {
                    const cmd = `npx prisma db push --schema=${packageSchemaPath}`;
                    log.info(`Running: ${cmd}`);
                    await runCommand(cmd);
                    log.success('已根据临时 schema 创建/同步数据库结构。');
                } catch (err) {
                    log.error('执行 prisma db push 失败，请手动检查。');
                    if (err instanceof Error) log.error(err.message);
                }
            } else {
                log.info('已跳过临时 schema 的数据库结构创建。');
            }
        });
    }
}

main();

// ========== 辅助函数：交互式提问 ==========
function promptYesNo(question: string): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            const normalized = (answer || '').trim().toLowerCase();
            resolve(normalized === 'y' || normalized === 'yes');
        });
    });
}

async function maybeRunInteractive(fn: () => Promise<void>) {
    // 在非交互环境（例如 CI）下跳过
    if (!process.stdout.isTTY) {
        log.info('检测到非交互式环境，自动跳过可选的数据库结构创建步骤。');
        return;
    }
    await fn();
}
