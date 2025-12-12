
import csv
import requests
import os
import urllib.parse
import time

def download_images(start_row=1, end_row=80):
    if not os.path.exists('imagenes'):
        os.makedirs('imagenes')

    csv_file_path = 'idcatalog.csv'
    # We will read from the original and write the updated rows to a new list
    rows_to_write = []
    
    with open(csv_file_path, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        header = next(reader)
        rows_to_write.append(header)
        
        # Store original rows to process them
        original_rows = list(reader)

    for i, row in enumerate(original_rows, 1):
        if start_row <= i <= end_row:
            if len(row) < 4 or not row[3]:
                print(f"  [!] Skipping row {i} (no URL).")
                rows_to_write.append(row)
                continue

            original_url = row[3].strip()
            
            # Use a simple, unique name based on row index to avoid conflicts
            # And use the product code from column A for clarity
            product_code = row[0].split('-')[0].strip()
            new_filename = f"{product_code}_{i}.jpg"
            new_filepath = os.path.join('imagenes', new_filename)
            
            # Update the row with the new local path
            row[3] = new_filepath
            
            try:
                cleaned_url = original_url.replace(" ", "%20")
                decoded_url = urllib.parse.unquote(cleaned_url)
                
                print(f"Downloading ({i}): {decoded_url} -> {new_filepath}")
                
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                response = requests.get(decoded_url, stream=True, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    with open(new_filepath, 'wb') as img_file:
                        for chunk in response.iter_content(chunk_size=8192):
                            img_file.write(chunk)
                else:
                    print(f"  [!] Failed: Status {response.status_code}")
                    row[3] = "" # Mark as failed

            except requests.exceptions.RequestException as e:
                print(f"  [!] Error: {e}")
                row[3] = "" # Mark as failed
            
            time.sleep(0.1)
        
        rows_to_write.append(row)

    # Overwrite the original CSV file with the updated data
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows_to_write)

    print(f"\nBatch ({start_row}-{end_row}) complete.")

if __name__ == "__main__":
    download_images(start_row=1, end_row=80)
