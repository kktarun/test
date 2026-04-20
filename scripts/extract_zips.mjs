import { createReadStream } from 'fs';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import { createUnzip } from 'zlib';
import { Parse } from 'unzipper';

const projectDir = '/vercel/share/v0-project';

async function extractZips() {
  const files = await readdir(projectDir);
  const zipFiles = files.filter(f => f.endsWith('.zip'));
  
  console.log(`Found ${zipFiles.length} zip files:\n`);
  
  for (const zipFile of zipFiles) {
    const zipPath = join(projectDir, zipFile);
    console.log(`\n${'='.repeat(50)}`);
    console.log(`ZIP FILE: ${zipFile}`);
    console.log('='.repeat(50));
    
    try {
      const entries = [];
      
      await new Promise((resolve, reject) => {
        createReadStream(zipPath)
          .pipe(Parse())
          .on('entry', async (entry) => {
            const fileName = entry.path;
            const type = entry.type;
            const size = entry.vars.uncompressedSize || 0;
            
            if (type === 'File') {
              const chunks = [];
              entry.on('data', chunk => chunks.push(chunk));
              entry.on('end', () => {
                const content = Buffer.concat(chunks);
                entries.push({ fileName, size, content });
              });
            } else {
              entry.autodrain();
            }
          })
          .on('close', resolve)
          .on('error', reject);
      });
      
      console.log('\nFiles in archive:');
      for (const entry of entries) {
        console.log(`  - ${entry.fileName} (${entry.size} bytes)`);
      }
      
      console.log('\nFile contents:');
      for (const entry of entries) {
        try {
          const text = entry.content.toString('utf-8');
          console.log(`\n--- ${entry.fileName} ---`);
          if (text.length > 5000) {
            console.log(text.slice(0, 5000));
            console.log(`\n... (truncated, total ${text.length} chars)`);
          } else {
            console.log(text);
          }
        } catch (e) {
          console.log(`\n--- ${entry.fileName} --- (binary file, ${entry.content.length} bytes)`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${zipFile}:`, err.message);
    }
  }
}

extractZips();
