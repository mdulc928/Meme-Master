#!/bin/bash

echo "Running postbuild.sh, finding all .gz and .br files in ./build..."
if [[ "$1" == "--force" ]]; then
    find ./build -type f \( -iname "*.gz" -o -iname "*.br" \) -delete;
else
    find ./build -type f \( -iname "*.gz" -o -iname "*.br" \)
    read -p "Press enter to continue"
    find ./build -type f \( -iname "*.gz" -o -iname "*.br" \) -delete;
fi