import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Read zip files using built-in zlib and manual zip parsing
const ZIP_FILES = [
  '/vercel/share/v0-project/b_9D6FyI0OfnS.zip',
  '/vercel/share/v0-project/b_Ozo4PDc7dJY.zip'
];

// Simple ZIP file parser (ZIP format is well-documented)
function parseZip(buffer) {
  const entries = [];
  let offset = 0;
  
  while (offset < buffer.length - 4) {
    // Look for local file header signature (0x04034b50)
    if (buffer.readUInt32LE(offset) === 0x04034b50) {
      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const uncompressedSize = buffer.readUInt32LE(offset + 22);
      const fileNameLength = buffer.readUInt16LE(offset + 26);
      const extraFieldLength = buffer.readUInt16LE(offset + 28);
      
      const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLength);
      const dataStart = offset + 30 + fileNameLength + extraFieldLength;
      const fileData = buffer.slice(dataStart, dataStart + compressedSize);
      
      entries.push({
        fileName,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        data: fileData
      });
      
      offset = dataStart + compressedSize;
    } else {
      offset++;
    }
  }
  
  return entries;
}

// Decompress using zlib if needed
import { inflateRawSync } from 'zlib';

function decompress(entry) {
  if (entry.compressionMethod === 0) {
    // Stored (no compression)
    return entry.data;
  } else if (entry.compressionMethod === 8) {
    // Deflate
    try {
      return inflateRawSync(entry.data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

for (const zipPath of ZIP_FILES) {
  console.log('\n' + '='.repeat(50));
  console.log('ZIP FILE:', zipPath.split('/').pop());
  console.log('='.repeat(50));
  
  try {
    const buffer = readFileSync(zipPath);
    const entries = parseZip(buffer);
    
    console.log('\nFiles in archive:');
    for (const entry of entries) {
      console.log(`  - ${entry.fileName} (${entry.uncompressedSize} bytes)`);
    }
    
    console.log('\nFile contents:');
    for (const entry of entries) {
      if (!entry.fileName.endsWith('/')) {
        const decompressed = decompress(entry);
        if (decompressed) {
          try {
            const text = decompressed.toString('utf8');
            console.log(`\n--- ${entry.fileName} ---`);
            console.log(text.slice(0, 5000));
            if (text.length > 5000) {
              console.log(`\n... (truncated, total ${text.length} chars)`);
            }
          } catch (e) {
            console.log(`\n--- ${entry.fileName} --- (binary file)`);
          }
        } else {
          console.log(`\n--- ${entry.fileName} --- (could not decompress)`);
        }
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}
