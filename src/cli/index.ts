#!/usr/bin/env node
import { Command } from 'commander';
import enquirer from 'enquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { authTemplate, envTemplate, tsConfigTemplate } from './templates.js';

const program = new Command();

program
  .name('kroxt')
  .description('Kroxt CLI for bootstrapping auth engines')
  .version('1.3.1');

program
  .command('init')
  .description('Initialize Kroxt in your project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log(chalk.bold.white('\n⬢ KROXT AUTH INITIALIZER\n'));

    try {
      let response = {
        adapter: 'memory',
        generateEnv: true,
        useRateLimit: true,
        useIPBlocking: true,
        useStrictRevocation: true,
        usePepper: true,
        createModel: true,
        targetDir: '',
        modelDir: ''
      };

      const projectContext = getProjectContext();
      let defaultDir = 'lib/kroxt';
      
      if (projectContext.isNext) {
          defaultDir = 'lib/kroxt';
      } else if (projectContext.isExpress || projectContext.isHono) {
          defaultDir = projectContext.hasSrc ? 'src/config' : 'config';
      } else if (projectContext.isVite) {
          defaultDir = projectContext.hasSrc ? 'src/plugins/kroxt' : 'plugins/kroxt';
      }

      if (!options.yes) {
        const answers1 = await (enquirer as any).prompt([
          {
            type: 'select',
            name: 'adapter',
            message: 'Choose your database adapter:',
            choices: [
              { name: 'memory', message: 'In-Memory (Testing)' },
              { name: 'mongoose', message: 'Mongoose (MongoDB)' },
              { name: 'prisma', message: 'Prisma (PostgreSQL/MySQL)' },
              { name: 'drizzle', message: 'Drizzle (SQLite/PostgreSQL)' },
              { name: 'none', message: 'None (Manual Setup)' }
            ]
          },
          {
            type: 'input',
            name: 'targetDir',
            message: 'Where should I put the Kroxt files?',
            initial: defaultDir
          }
        ]);

        const answers2 = await (enquirer as any).prompt([
          {
            type: 'confirm',
            name: 'useRateLimit',
            message: 'Enable rate limiting defensive layer?',
            initial: true
          },
          {
            type: 'confirm',
            name: 'useIPBlocking',
            message: 'Enable automatic IP blocking?',
            initial: true
          },
          {
            type: 'confirm',
            name: 'useStrictRevocation',
            message: 'Enforce strict session revocation?',
            initial: true
          },
          {
            type: 'confirm',
            name: 'usePepper',
            message: 'Use server-side password peppering?',
            initial: true
          },
          {
            type: 'confirm',
            name: 'createModel',
            message: 'Create a boilerplate User model for you?',
            initial: true
          }
        ]);

        response = { ...response, ...answers1, ...answers2 };

        if (response.createModel && response.adapter !== 'memory' && response.adapter !== 'none') {
          const { modelDir } = await (enquirer as any).prompt({
            type: 'input',
            name: 'modelDir',
            message: 'Where should I put the User model?',
            initial: projectContext.isNext ? 'models/' : (projectContext.hasSrc ? 'src/models/' : 'models/')
          });
          response.modelDir = modelDir;
        }

        const { generateEnv } = await (enquirer as any).prompt({
          type: 'confirm',
          name: 'generateEnv',
          message: 'Generate secure secrets in .env?',
          initial: true
        });
        response.generateEnv = generateEnv;
      } else {
        console.log(chalk.gray('Using default settings (--yes)...'));
        response = {
          ...response,
          useRateLimit: true,
          useIPBlocking: true,
          useStrictRevocation: true,
          usePepper: true,
          createModel: true,
          targetDir: defaultDir
        } as any;
      }

      const secret = crypto.randomBytes(32).toString('hex');
      const authContent = authTemplate(response.adapter, secret, response);

      // Write auth.ts
      const authPath = path.join(process.cwd(), response.targetDir, 'auth.ts');
      const dirPath = path.dirname(authPath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(authPath, authContent);
      console.log(chalk.green(`\n✔ Created: ${chalk.white(path.relative(process.cwd(), authPath))}`));

      // Write tsconfig.json if not present
      const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
      if (!fs.existsSync(tsConfigPath)) {
        fs.writeFileSync(tsConfigPath, tsConfigTemplate);
        console.log(chalk.green(`✔ Created: ${chalk.white('tsconfig.json')}`));
      }

      // Write User Model if requested
      if (response.createModel && response.adapter !== 'memory' && response.adapter !== 'none') {
        let modelPath = '';
        const targetModelDir = response.modelDir || response.targetDir;
        
        switch (response.adapter) {
          case 'mongoose':
            modelPath = path.join(process.cwd(), targetModelDir, 'user.model.ts');
            break;
          case 'drizzle':
            modelPath = path.join(process.cwd(), targetModelDir, 'schema.ts');
            break;
          case 'prisma':
            modelPath = path.join(process.cwd(), targetModelDir, 'user.prisma');
            break;
        }

        if (modelPath) {
          const modelDirPath = path.dirname(modelPath);
          if (!fs.existsSync(modelDirPath)) {
            fs.mkdirSync(modelDirPath, { recursive: true });
          }
          
          const { userModelTemplate } = await import('./templates.js');
          fs.writeFileSync(modelPath, userModelTemplate(response.adapter));
          console.log(chalk.green(`✔ Created: ${chalk.white(path.relative(process.cwd(), modelPath))}`));
        }
      }

      // Write .env
      if (response.generateEnv) {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = envTemplate(secret, response.usePepper);
        
        if (fs.existsSync(envPath)) {
          fs.appendFileSync(envPath, envContent);
          console.log(chalk.green(`✔ Updated: ${chalk.white('.env')} (Appended JWT_SECRET)`));
        } else {
          fs.writeFileSync(envPath, envContent);
          console.log(chalk.green(`✔ Created: ${chalk.white('.env')}`));
        }
      }

      console.log(chalk.bold.white('\nKroxt is ready. Happy coding! 🚀\n'));

      // --- DEPENDENCY AUTO-INSTALLATION ---
      await checkAndInstallDeps(response.adapter, !!options.yes);

    } catch (err) {
      console.error(chalk.red('\n✖ Initialization cancelled.'));
      process.exit(1);
    }
  });

async function checkAndInstallDeps(adapter: string, skipPrompts: boolean = false) {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const required: Record<string, string[]> = {
    memory: ['kroxt', 'dotenv'],
    mongoose: ['kroxt', 'mongoose', 'dotenv'],
    prisma: ['kroxt', '@prisma/client', 'dotenv'],
    drizzle: ['kroxt', 'drizzle-orm', 'dotenv'],
    hono: ['kroxt', 'hono', 'dotenv'],
    none: ['kroxt']
  };

  const packages = required[adapter] || [];
  const missing = packages.filter(dep => !deps[dep]);

  if (missing.length > 0) {
    let confirm = true;

    if (!skipPrompts) {
      const result = await (enquirer as any).prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Required dependencies are missing: ${chalk.cyan(missing.join(', '))}. Install them now?`,
        initial: true
      });
      confirm = result.confirm;
    }

    if (confirm) {
      console.log(chalk.gray(`\nInstalling ${missing.join(', ')}...`));
      return new Promise((resolve) => {
        const child = spawn('npm', ['install', ...missing], { 
          stdio: 'inherit',
          shell: true 
        });
        child.on('close', resolve);
      });
    }
  }
}

function getProjectContext() {
  const root = process.cwd();
  const pkgPath = path.join(root, 'package.json');
  const hasSrc = fs.existsSync(path.join(root, 'src'));
  const hasAppRouter = fs.existsSync(path.join(root, 'app'));
  const hasSrcAppRouter = fs.existsSync(path.join(root, 'src', 'app'));
  const hasPagesRouter = fs.existsSync(path.join(root, 'pages'));
  const hasSrcPagesRouter = fs.existsSync(path.join(root, 'src', 'pages'));
  
  let isExpress = false;
  let isNext = false;
  let isHono = false;
  let isVite = false;

  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    isExpress = !!(deps.express || deps.fastify);
    isNext = !!deps.next;
    isHono = !!deps.hono;
    isVite = !!deps.vite;
  }

  return { hasSrc, hasAppRouter, hasSrcAppRouter, hasPagesRouter, hasSrcPagesRouter, isExpress, isNext, isHono, isVite };
}

program.parse(process.argv);
