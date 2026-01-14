#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const COMMANDS_DIR = path.join(PLUGIN_ROOT, 'commands');
const PLUGIN_JSON = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');

type ValidationError = { file: string; message: string };

const errors: ValidationError[] = [];
const warnings: ValidationError[] = [];

function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter: Record<string, string> = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function validateSkills(): void {
  console.log('Validating skills...');

  if (!fs.existsSync(SKILLS_DIR)) {
    errors.push({ file: SKILLS_DIR, message: 'Skills directory does not exist' });
    return;
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  let validCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      warnings.push({
        file: path.join(SKILLS_DIR, entry.name),
        message: 'Skills directory should only contain directories',
      });
      continue;
    }

    const skillDir = path.join(SKILLS_DIR, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillFile)) {
      errors.push({ file: skillDir, message: 'Missing SKILL.md file' });
      continue;
    }

    const content = fs.readFileSync(skillFile, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      errors.push({ file: skillFile, message: 'Missing or invalid frontmatter' });
      continue;
    }

    if (!frontmatter.name) {
      errors.push({ file: skillFile, message: 'Missing "name" in frontmatter' });
    } else if (!frontmatter.name.startsWith('laravel:')) {
      errors.push({
        file: skillFile,
        message: `Name must start with "laravel:", got "${frontmatter.name}"`,
      });
    }

    if (!frontmatter.description || frontmatter.description.trim() === '') {
      errors.push({ file: skillFile, message: 'Missing or empty "description" in frontmatter' });
    }

    validCount++;
  }

  console.log(`  Found ${validCount} valid skills`);
}

function validateCommands(): void {
  console.log('Validating commands...');

  if (!fs.existsSync(COMMANDS_DIR)) {
    warnings.push({ file: COMMANDS_DIR, message: 'Commands directory does not exist (optional)' });
    return;
  }

  const files = fs.readdirSync(COMMANDS_DIR);
  let validCount = 0;

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const commandFile = path.join(COMMANDS_DIR, file);
    const content = fs.readFileSync(commandFile, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      errors.push({ file: commandFile, message: 'Missing or invalid frontmatter' });
      continue;
    }

    if (!frontmatter.description || frontmatter.description.trim() === '') {
      errors.push({ file: commandFile, message: 'Missing or empty "description" in frontmatter' });
    }

    validCount++;
  }

  console.log(`  Found ${validCount} valid commands`);
}

function validatePluginJson(): void {
  console.log('Validating plugin.json...');

  if (!fs.existsSync(PLUGIN_JSON)) {
    errors.push({ file: PLUGIN_JSON, message: 'plugin.json does not exist' });
    return;
  }

  try {
    const content = fs.readFileSync(PLUGIN_JSON, 'utf-8');
    const json = JSON.parse(content);

    const requiredFields = ['name', 'description', 'version'];

    for (const field of requiredFields) {
      if (!json[field]) {
        errors.push({ file: PLUGIN_JSON, message: `Missing required field: "${field}"` });
      }
    }

    console.log(`  Plugin: ${json.name} v${json.version}`);
  } catch (e) {
    errors.push({
      file: PLUGIN_JSON,
      message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
    });
  }
}

function validateHooks(): void {
  console.log('Validating hooks...');

  const hooksJson = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
  const sessionStart = path.join(PLUGIN_ROOT, 'hooks', 'session-start.sh');

  if (!fs.existsSync(hooksJson)) {
    errors.push({ file: hooksJson, message: 'hooks.json does not exist' });
  } else {
    try {
      JSON.parse(fs.readFileSync(hooksJson, 'utf-8'));
    } catch (e) {
      errors.push({
        file: hooksJson,
        message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  }

  if (!fs.existsSync(sessionStart)) {
    errors.push({ file: sessionStart, message: 'session-start.sh does not exist' });
  }
}

console.log('\n===========================================');
console.log('Validating superpowers-laravel plugin');
console.log('===========================================\n');

validatePluginJson();
validateHooks();
validateSkills();
validateCommands();

if (warnings.length) {
  console.log('\nWarnings:\n');
  for (const w of warnings) console.log(`  ${w.file}\n    -> ${w.message}`);
}

if (errors.length) {
  console.error('\nErrors:\n');
  for (const e of errors) console.error(`  ${e.file}\n    -> ${e.message}`);
  process.exit(1);
}

console.log('\nAll validations passed!');
