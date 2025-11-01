#!/bin/bash

# Script to generate PWA icons from a source logo
# Requires ImageMagick (convert command)

set -e

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first."
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Fedora: sudo dnf install imagemagick"
    exit 1
fi

# Source logo file
SOURCE_LOGO="public/assets/logo.png"
OUTPUT_DIR="public"

# Check if source logo exists
if [ ! -f "$SOURCE_LOGO" ]; then
    echo "Error: Source logo not found at $SOURCE_LOGO"
    echo "Please create an assets/logo.png file (recommended size: 512x512 or larger)"
    exit 1
fi

echo "Generating PWA icons from $SOURCE_LOGO..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate various icon sizes for PWA
# Standard sizes for web app manifests
SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
    echo "Generating ${size}x${size} icon..."
    convert "$SOURCE_LOGO" \
        -resize "${size}x${size}" \
        -background none \
        -gravity center \
        -extent "${size}x${size}" \
        "$OUTPUT_DIR/icons/icon-${size}x${size}.png"
done

# Generate Apple Touch Icon (180x180)
echo "Generating Apple Touch Icon (180x180)..."
convert "$SOURCE_LOGO" \
    -resize "180x180" \
    -background none \
    -gravity center \
    -extent "180x180" \
    "$OUTPUT_DIR/apple-touch-icon.png"

# Generate favicon sizes
echo "Generating favicon (32x32)..."
convert "$SOURCE_LOGO" \
    -resize "32x32" \
    -background none \
    -gravity center \
    -extent "32x32" \
    "$OUTPUT_DIR/favicon-32x32.png"

echo "Generating favicon (16x16)..."
convert "$SOURCE_LOGO" \
    -resize "16x16" \
    -background none \
    -gravity center \
    -extent "16x16" \
    "$OUTPUT_DIR/favicon-16x16.png"

# Generate .ico file with multiple sizes
echo "Generating favicon.ico..."
convert "$SOURCE_LOGO" \
    -resize "16x16" \
    -background none \
    -gravity center \
    -extent "16x16" \
    "$OUTPUT_DIR/favicon-16.png"

convert "$SOURCE_LOGO" \
    -resize "32x32" \
    -background none \
    -gravity center \
    -extent "32x32" \
    "$OUTPUT_DIR/favicon-32.png"

convert "$OUTPUT_DIR/favicon-16.png" "$OUTPUT_DIR/favicon-32.png" "$OUTPUT_DIR/favicon.ico"
rm "$OUTPUT_DIR/favicon-16.png" "$OUTPUT_DIR/favicon-32.png"

# Generate maskable icon (for Android adaptive icons)
echo "Generating maskable icon (512x512 with safe zone)..."
convert "$SOURCE_LOGO" \
    -resize "410x410" \
    -background none \
    -gravity center \
    -extent "512x512" \
    "$OUTPUT_DIR/icons/icon-maskable-512x512.png"

echo ""
echo "✅ PWA icons generated successfully!"
echo ""
echo "Generated files:"
for size in "${SIZES[@]}"; do
    echo "  - icon-${size}x${size}.png"
done
echo "  - apple-touch-icon.png"
echo "  - favicon-32x32.png"
echo "  - favicon-16x16.png"
echo "  - favicon.ico"
echo "  - icons/icon-maskable-512x512.png"
echo ""
echo "Next steps:"
echo "1. Icons are already configured in client-svelte/public/manifest.json"
echo "2. Favicon links are already added to client-svelte/index.html"
echo "3. You're ready to deploy your PWA!"
