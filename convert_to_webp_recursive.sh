#!/bin/bash
INPUT_DIR="/home/julien/www/smart-form-v2/public/assets/images"
OUTPUT_DIR="/home/julien/www/smart-form-v2/public/assets/images"
mkdir -p "$OUTPUT_DIR"

process_file(){
	local file="$1"
	local rel_path="${file#$INPUT_DIR/}"
	local base_name=$(basename "${file%.*}")
	local output_path="$OUTPUT_DIR/$base_name.webP"

	if [ -f "output_path" ]; then
		echo "Ignoré : $output_path éxiste déjà."
		return
	fi

	mkdir -p "$(dirname "output_path")"

	if [[ "$file" == *.bz2 ]]; then
		temp_file="/tmp/${base_name%.bz2}"
		bunzip2 -k "$file" -c > "$temp_file"
		cwebp "$temp_file" -q 80 -o "$output_path"
		rm "$temp_file"
	elif [[ "$file" == *.jpg || "$file" == *.jpeg ]]; then
		cwebp "$file" -q 80 -o "$output_path"
	fi

	echo "converti: $file -> $output_path"
}

find "$INPUT_DIR" -type f \( -name "*.jpg" -o -name "*.bz2" -o -name "*.jpeg" \) | while read file; do
	process_file "$file"
done
