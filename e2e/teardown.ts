import { execSync } from 'child_process';

async function globalTeardown() {
  console.log('E2E Teardown: Running cleanup script...');
  try {
    execSync('pnpm test:cleanup', { stdio: 'inherit' });
    console.log('E2E Teardown: Cleanup complete.');
  } catch (error) {
    console.error('E2E Teardown: Cleanup failed:', error);
  }
}

export default globalTeardown;
