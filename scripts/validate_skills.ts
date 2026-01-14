#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const COMMANDS_DIR = path.join(PLUGIN_ROOT, 'commands');
const PLUGIN_JSON = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
const errors = [] as {file:string; message:string}[];
const warnings = [] as {file:string; message:string}[];
function parseFrontmatter(content: string): Record<string,string> | null {
  const match = content.match(/^---
([\s\S]*?)
---/);
  if (!match) return null;
  const frontmatter: Record<string,string> = {};
  for (const line of match[1].split('
')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      frontmatter[line.slice(0, idx).trim()] = line.slice(idx+1).trim();
    }
  }
  return frontmatter;
}
function validateSkills() {
  if (!fs.existsSync(SKILLS_DIR)) { errors.push({file:SKILLS_DIR, message:'Skills directory does not exist'}); return; }
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) { warnings.push({file:path.join(SKILLS_DIR, entry.name), message:'Skills directory should only contain directories'}); continue; }
    const skillDir = path.join(SKILLS_DIR, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) { errors.push({file:skillDir, message:'Missing SKILL.md file'}); continue; }
    const content = fs.readFileSync(skillFile, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) { errors.push({file:skillFile, message:'Missing or invalid frontmatter'}); continue; }
    if (!fm.name) errors.push({file:skillFile, message:'Missing "name" in frontmatter'});
    else if (!fm.name.startsWith('laravel:')) errors.push({file:skillFile, message:`Name must start with "laravel:", got "${fm.name}"`});
    if (!fm.description || fm.description.trim() === '') errors.push({file:skillFile, message:'Missing or empty "description" in frontmatter'});
    count++;
  }
  console.log(`  Found ${count} valid skills`);
}
function validateCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) { warnings.push({file:COMMANDS_DIR, message:'Commands directory does not exist (optional)'}); return; }
  const files = fs.readdirSync(COMMANDS_DIR);
  let count = 0;
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const file = path.join(COMMANDS_DIR, f);
    const content = fs.readFileSync(file, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) { errors.push({file, message:'Missing or invalid frontmatter'}); continue; }
    if (!fm.description || fm.description.trim() === '') errors.push({file, message:'Missing or empty "description" in frontmatter'});
    count++;
  }
  console.log(`  Found ${count} valid commands`);
}
function validatePluginJson() {
  if (!fs.existsSync(PLUGIN_JSON)) { errors.push({file:PLUGIN_JSON, message:'plugin.json does not exist'}); return; }
  try {
    const json = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf-8'));
    for (const f of ['name','description','version']) if (!json[f]) errors.push({file:PLUGIN_JSON, message:`Missing required field: "${f}"`});
    console.log(`  Plugin: ${json.name} v${json.version}`);
  } catch (e:any) {
    errors.push({file:PLUGIN_JSON, message:`Invalid JSON: ${e?.message || 'Unknown error'}`});
  }
}
function validateHooks() {
  const hooksJson = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
  const sessionStart = path.join(PLUGIN_ROOT, 'hooks', 'session-start.sh');
  if (!fs.existsSync(hooksJson)) errors.push({file:hooksJson, message:'hooks.json does not exist'});
  else {
    try { JSON.parse(fs.readFileSync(hooksJson, 'utf-8')); } catch (e:any) { errors.push({file:hooksJson, message:`Invalid JSON: ${e?.message || 'Unknown error'}`}); }
  }
  if (!fs.existsSync(sessionStart)) errors.push({file:sessionStart, message:'session-start.sh does not exist'});
}
console.log('
===========================================');
console.log('Validating superpowers-laravel plugin');
console.log('===========================================
');
console.log('Validating plugin.json...');
validatePluginJson();
console.log('Validating hooks...');
validateHooks();
console.log('Validating skills...');
validateSkills();
console.log('Validating commands...');
validateCommands();
if (warnings.length) {
  console.log('
Warnings:
');
  for (const w of warnings) console.log(`  ${w.file}
    -> ${w.message}`);
}
if (errors.length) {
  console.error('
Errors:
');
  for (const e of errors) console.error(`  ${e.file}
    -> ${e.message}`);
  process.exit(1);
}
console.log('
All validations passed!');
