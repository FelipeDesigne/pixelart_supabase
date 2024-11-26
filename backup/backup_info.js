import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create a backup
export async function createBackup(description, filesToBackup) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, `${timestamp}_${description}`);
    
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copy each file to backup
    for (const file of filesToBackup) {
        const fileName = path.basename(file);
        const content = await fs.readFile(file, 'utf8');
        await fs.writeFile(path.join(backupDir, fileName), content);
    }
    
    // Create backup info file
    const backupInfo = {
        timestamp,
        description,
        files: filesToBackup,
        created: new Date().toISOString()
    };
    
    await fs.writeFile(
        path.join(backupDir, 'backup_info.json'),
        JSON.stringify(backupInfo, null, 2)
    );
    
    return backupDir;
}

// Function to restore from backup
export async function restoreFromBackup(backupDir) {
    const backupInfo = JSON.parse(
        await fs.readFile(path.join(backupDir, 'backup_info.json'), 'utf8')
    );
    
    for (const originalPath of backupInfo.files) {
        const fileName = path.basename(originalPath);
        const backupContent = await fs.readFile(path.join(backupDir, fileName), 'utf8');
        await fs.writeFile(originalPath, backupContent);
    }
}

// Function to list all backups
export async function listBackups() {
    const dirs = await fs.readdir(__dirname);
    const backups = [];
    
    for (const dir of dirs) {
        try {
            const stat = await fs.stat(path.join(__dirname, dir));
            if (stat.isDirectory() && dir !== 'node_modules') {
                const infoPath = path.join(__dirname, dir, 'backup_info.json');
                const info = JSON.parse(await fs.readFile(infoPath, 'utf8'));
                backups.push(info);
            }
        } catch (e) {
            // Skip if not a backup directory
        }
    }
    
    return backups;
}

// Function to delete a backup
export async function deleteBackup(backupDir) {
    await fs.rm(backupDir, { recursive: true, force: true });
}

export {
    createBackup,
    restoreFromBackup,
    listBackups,
    deleteBackup
};
