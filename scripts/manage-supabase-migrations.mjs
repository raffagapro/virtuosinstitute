import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptFilePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptFilePath), '..');
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const draftDir = path.join(rootDir, 'supabase', 'draft');
const trackerPath = path.join(rootDir, 'supabase', 'migration-status.json');

const readinessStates = new Set(['draft', 'ready', 'blocked']);
const applyStates = new Set(['not-applied', 'applied']);

function loadTracker() {
  const raw = fs.readFileSync(trackerPath, 'utf8');
  return JSON.parse(raw);
}

function saveTracker(data) {
  fs.writeFileSync(trackerPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function listSqlFilesInDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
}

function listMigrationLayout() {
  const active = listSqlFilesInDir(migrationsDir);
  const draft = listSqlFilesInDir(draftDir);
  return {
    active,
    draft,
    all: Array.from(new Set([...active, ...draft])).sort(),
  };
}

function ensureTrackerSynced(tracker, layout) {
  for (const file of layout.all) {
    if (!tracker.migrations[file]) {
      tracker.migrations[file] = {
        readiness: 'draft',
        local: 'not-applied',
        linked: 'not-applied',
        notes: 'Scaffold or not reviewed yet',
      };
    }
  }

  for (const file of Object.keys(tracker.migrations)) {
    if (!layout.all.includes(file)) {
      delete tracker.migrations[file];
    }
  }

  return tracker;
}

function resolveMigrationName(input, tracker) {
  const files = Object.keys(tracker.migrations);
  const exact = files.find((file) => file === input);
  if (exact) {
    return exact;
  }

  const prefix = files.find((file) => file.startsWith(`${input}_`) || file.startsWith(input));
  if (prefix) {
    return prefix;
  }

  throw new Error(`Unknown migration: ${input}`);
}

function printStatus(tracker, layout) {
  const rows = Object.entries(tracker.migrations).map(([file, meta]) => ({
    file,
    location: layout.active.includes(file) ? 'migrations' : layout.draft.includes(file) ? 'draft' : 'missing',
    readiness: meta.readiness,
    local: meta.local,
    linked: meta.linked,
    notes: meta.notes ?? '',
  }));

  const headers = ['FILE', 'LOCATION', 'READY', 'LOCAL', 'LINKED', 'NOTES'];
  const widths = [
    Math.max(headers[0].length, ...rows.map((row) => row.file.length)),
    Math.max(headers[1].length, ...rows.map((row) => row.location.length)),
    Math.max(headers[2].length, ...rows.map((row) => row.readiness.length)),
    Math.max(headers[3].length, ...rows.map((row) => row.local.length)),
    Math.max(headers[4].length, ...rows.map((row) => row.linked.length)),
    Math.max(headers[5].length, ...rows.map((row) => row.notes.length)),
  ];

  const format = (value, width) => value.padEnd(width, ' ');
  console.log([
    format(headers[0], widths[0]),
    format(headers[1], widths[1]),
    format(headers[2], widths[2]),
    format(headers[3], widths[3]),
    format(headers[4], widths[4]),
  ].join(' | '));
  console.log(widths.map((width) => '-'.repeat(width)).join('-|-'));
  for (const row of rows) {
    console.log([
      format(row.file, widths[0]),
      format(row.location, widths[1]),
      format(row.readiness, widths[2]),
      format(row.local, widths[3]),
      format(row.linked, widths[4]),
      format(row.notes, widths[5]),
    ].join(' | '));
  }
}

function setReadiness(tracker, migrationName, nextState, notes) {
  if (!readinessStates.has(nextState)) {
    throw new Error(`Invalid readiness state: ${nextState}`);
  }

  tracker.migrations[migrationName].readiness = nextState;
  if (typeof notes === 'string') {
    tracker.migrations[migrationName].notes = notes;
  }
}

function setApplyState(tracker, migrationName, envName, nextState) {
  if (!applyStates.has(nextState)) {
    throw new Error(`Invalid apply state: ${nextState}`);
  }

  tracker.migrations[migrationName][envName] = nextState;
}

function pendingMigrations(tracker, envName, layout) {
  return Object.entries(tracker.migrations)
    .filter(([file, meta]) => layout.active.includes(file) && meta[envName] !== 'applied')
    .map(([file, meta]) => ({ file, meta }));
}

function checkPushable(tracker, envName, layout) {
  const pending = pendingMigrations(tracker, envName, layout);
  const blockers = pending.filter(({ meta }) => meta.readiness !== 'ready');
  return { pending, blockers };
}

function runSupabasePush(envName, dryRun) {
  const args = ['supabase', 'db', 'push', envName === 'local' ? '--local' : '--linked'];
  if (dryRun) {
    args.push('--dry-run');
  }

  const result = spawnSync('npx', args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printUsage() {
  console.log(`Usage:
  npm run supabase:migrations:status
  npm run supabase:migrations -- sync
  npm run supabase:migrations -- ready <migration> [note]
  npm run supabase:migrations -- draft <migration> [note]
  npm run supabase:migrations -- blocked <migration> [note]
  npm run supabase:migrations -- mark-local <migration> <not-applied|applied>
  npm run supabase:migrations -- mark-linked <migration> <not-applied|applied>
  npm run supabase:migrations -- note <migration> <text>
  npm run supabase:migrations -- check-push --env=local|linked
  npm run supabase:db:push:local
  npm run supabase:db:push:linked

Notes:
  - Active migrations live in supabase/migrations.
  - Draft or parked migrations live in supabase/draft.
  - Supabase CLI applies all pending migrations from supabase/migrations; it does not provide a first-class "push only this exact migration" workflow.
  - Use folder placement plus readiness status to control what gets pushed.
`);
}

function main() {
  const [command = 'status', ...rest] = process.argv.slice(2);
  const layout = listMigrationLayout();
  const tracker = ensureTrackerSynced(loadTracker(), layout);

  if (command === 'status') {
    saveTracker(tracker);
    printStatus(tracker, layout);
    return;
  }

  if (command === 'sync') {
    saveTracker(tracker);
    console.log('Migration tracker synced with supabase/migrations.');
    return;
  }

  if (command === 'ready' || command === 'draft' || command === 'blocked') {
    const [rawMigration, ...noteParts] = rest;
    if (!rawMigration) {
      throw new Error('Missing migration identifier.');
    }
    const migrationName = resolveMigrationName(rawMigration, tracker);
    setReadiness(tracker, migrationName, command, noteParts.join(' ').trim() || undefined);
    saveTracker(tracker);
    console.log(`Updated ${migrationName}: readiness=${command}`);
    return;
  }

  if (command === 'mark-local' || command === 'mark-linked') {
    const [rawMigration, nextState] = rest;
    if (!rawMigration || !nextState) {
      throw new Error('Missing migration identifier or apply state.');
    }
    const migrationName = resolveMigrationName(rawMigration, tracker);
    setApplyState(tracker, migrationName, command === 'mark-local' ? 'local' : 'linked', nextState);
    saveTracker(tracker);
    console.log(`Updated ${migrationName}: ${command === 'mark-local' ? 'local' : 'linked'}=${nextState}`);
    return;
  }

  if (command === 'note') {
    const [rawMigration, ...noteParts] = rest;
    if (!rawMigration || noteParts.length === 0) {
      throw new Error('Missing migration identifier or note text.');
    }
    const migrationName = resolveMigrationName(rawMigration, tracker);
    tracker.migrations[migrationName].notes = noteParts.join(' ').trim();
    saveTracker(tracker);
    console.log(`Updated ${migrationName}: note saved.`);
    return;
  }

  if (command === 'check-push' || command === 'push') {
    const envFlag = rest.find((item) => item.startsWith('--env='));
    const dryRun = rest.includes('--dry-run');
    const envName = envFlag?.slice('--env='.length);
    if (envName !== 'local' && envName !== 'linked') {
      throw new Error('Missing or invalid --env=local|linked');
    }

    const { pending, blockers } = checkPushable(tracker, envName, layout);

    if (pending.length === 0) {
      console.log(`No pending ${envName} migrations to push from supabase/migrations.`);
      return;
    }

    console.log(`Pending ${envName} migrations in supabase/migrations:`);
    for (const { file, meta } of pending) {
      console.log(`- ${file} [${meta.readiness}]`);
    }

    if (blockers.length > 0) {
      console.error(`\nPush blocked: ${blockers.length} pending migration(s) are not ready.`);
      for (const { file, meta } of blockers) {
        console.error(`- ${file} (${meta.readiness}) ${meta.notes ? `- ${meta.notes}` : ''}`);
      }
      process.exit(1);
    }

    if (command === 'check-push') {
      console.log('\nAll pending migrations are marked ready.');
      return;
    }

    runSupabasePush(envName, dryRun);
    return;
  }

  printUsage();
  process.exit(1);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  printUsage();
  process.exit(1);
}