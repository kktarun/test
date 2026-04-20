import zipfile
import os

zip_files = [
    '/vercel/share/v0-project/b_9D6FyI0OfnS.zip',
    '/vercel/share/v0-project/b_Ozo4PDc7dJY.zip'
]

for zip_path in zip_files:
    print(f"\n{'='*50}")
    print(f"ZIP FILE: {os.path.basename(zip_path)}")
    print('='*50)
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # List all files in the zip
            print("\nFiles in archive:")
            for info in zip_ref.infolist():
                print(f"  - {info.filename} ({info.file_size} bytes)")
            
            # Extract and read text files
            print("\nFile contents:")
            for info in zip_ref.infolist():
                if not info.is_dir():
                    try:
                        content = zip_ref.read(info.filename)
                        # Try to decode as text
                        try:
                            text_content = content.decode('utf-8')
                            print(f"\n--- {info.filename} ---")
                            print(text_content[:5000])  # Limit output
                            if len(text_content) > 5000:
                                print(f"\n... (truncated, total {len(text_content)} chars)")
                        except UnicodeDecodeError:
                            print(f"\n--- {info.filename} --- (binary file, {len(content)} bytes)")
                    except Exception as e:
                        print(f"Error reading {info.filename}: {e}")
    except Exception as e:
        print(f"Error opening zip: {e}")
