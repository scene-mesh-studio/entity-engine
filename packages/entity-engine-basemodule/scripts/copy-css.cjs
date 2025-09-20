#!/usr/bin/env node
/**
 * 简单复制 src 下的 .module.css/.scss/.sass 到 dist 保持相对目录结构。
 */

const { cpSync, mkdirSync, existsSync, readdirSync, statSync } = require('fs');
const { join, dirname } = require('path');

const SRC = join(__dirname, '..', 'src');
const DIST = join(__dirname, '..', 'dist');

const exts = ['.module.css', '.module.scss', '.module.sass'];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = full.substring(SRC.length + 1);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else if (exts.some(e => full.endsWith(e))) {
      const target = join(DIST, rel);
      const targetDir = dirname(target);
      if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
      cpSync(full, target);
      console.log('Copied', rel);
    }
  }
}

walk(SRC);
