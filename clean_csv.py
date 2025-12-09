
import csv

def clean_csv():
    csv_file_path = 'idcatalog.csv'
    temp_csv_path = 'idcatalog_cleaned.csv'
    
    with open(csv_file_path, 'r', encoding='utf-8') as infile, \
         open(temp_csv_path, 'w', newline='', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        header = next(reader)
        writer.writerow(header)
        
        for row in reader:
            if len(row) > 3:
                # Trim whitespace from the image path
                row[3] = row[3].strip()
            writer.writerow(row)
            
    os.replace(temp_csv_path, csv_file_path)
    print("CSV cleaning complete.")

import os
if __name__ == "__main__":
    clean_csv()
