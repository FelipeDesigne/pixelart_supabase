import { createBackup, restoreFromBackup, listBackups, deleteBackup } from './backup_info.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2];
const description = process.argv[3];
const files = process.argv.slice(4);

const projectRoot = path.join(__dirname, '..');

async function main() {
    try {
        switch (command) {
            case 'create':
                if (!description || files.length === 0) {
                    console.log('Usage: node backup.js create <description> <file1> [file2] ...');
                    process.exit(1);
                }
                const fullPaths = files.map(f => path.join(projectRoot, f));
                const backupDir = await createBackup(description, fullPaths);
                console.log(`Backup created at: ${backupDir}`);
                break;

            case 'restore':
                if (!description) {
                    console.log('Usage: node backup.js restore <backup-directory>');
                    process.exit(1);
                }
                await restoreFromBackup(description);
                console.log('Backup restored successfully');
                break;

            case 'list':
                const backups = await listBackups();
                console.log('\nAvailable backups:');
                backups.forEach(backup => {
                    console.log(`\n${backup.timestamp} - ${backup.description}`);
                    console.log('Files:');
                    backup.files.forEach(f => console.log(`  - ${path.relative(projectRoot, f)}`));
                });
                break;

            case 'delete':
                if (!description) {
                    console.log('Usage: node backup.js delete <backup-directory>');
                    process.exit(1);
                }
                await deleteBackup(description);
                console.log('Backup deleted successfully');
                break;

            default:
                console.log(`
Usage:
  node backup.js create <description> <file1> [file2] ...  - Create a new backup
  node backup.js restore <backup-directory>               - Restore from a backup
  node backup.js list                                    - List all backups
  node backup.js delete <backup-directory>               - Delete a backup
                `);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
