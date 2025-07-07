#!/bin/bash

# WebAssembly build script for audio processing modules
set -e

echo "Building WebAssembly modules..."

# Check if Emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found. Please install and activate the Emscripten SDK."
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create output directory
mkdir -p ../../public/wasm

# Build DTW module
echo "Building DTW module..."
emcc dtw.cpp \
    -O3 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "getValue", "setValue"]' \
    -s EXPORTED_FUNCTIONS='["_compute_dtw_distance", "_compute_normalized_dtw", "_malloc", "_free"]' \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="DTWModule" \
    -s ENVIRONMENT=web \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=16777216 \
    -s MAXIMUM_MEMORY=134217728 \
    -s STACK_SIZE=1048576 \
    -s NO_EXIT_RUNTIME=1 \
    -s FILESYSTEM=0 \
    -s FETCH=0 \
    --bind \
    -o ../../public/wasm/dtw.js

# Build HMM module
echo "Building HMM module..."
emcc hmm.cpp \
    -O3 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "getValue", "setValue"]' \
    -s EXPORTED_FUNCTIONS='["_viterbi_decode", "_forward_algorithm", "_malloc", "_free"]' \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="HMMModule" \
    -s ENVIRONMENT=web \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=16777216 \
    -s MAXIMUM_MEMORY=134217728 \
    -s STACK_SIZE=1048576 \
    -s NO_EXIT_RUNTIME=1 \
    -s FILESYSTEM=0 \
    -s FETCH=0 \
    --bind \
    -o ../../public/wasm/hmm.js

# Build combined audio processor
echo "Building audio processor module..."
emcc audio_processor.cpp \
    -O3 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "getValue", "setValue"]' \
    -s EXPORTED_FUNCTIONS='["_process_audio_features", "_extract_mfcc", "_malloc", "_free"]' \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="AudioProcessorModule" \
    -s ENVIRONMENT=web \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=33554432 \
    -s MAXIMUM_MEMORY=268435456 \
    -s STACK_SIZE=2097152 \
    -s NO_EXIT_RUNTIME=1 \
    -s FILESYSTEM=0 \
    -s FETCH=0 \
    --bind \
    -o ../../public/wasm/audio_processor.js

# Create TypeScript type definitions
echo "Generating TypeScript definitions..."
cat > ../../src/types/wasm.ts << 'EOF'
export interface DTWModule {
  compute_dtw_distance(
    seq1: number, seq1_len: number, feature_dim1: number,
    seq2: number, seq2_len: number, feature_dim2: number
  ): number;
  compute_normalized_dtw(
    seq1: number, seq1_len: number, feature_dim1: number,
    seq2: number, seq2_len: number, feature_dim2: number
  ): number;
  malloc(size: number): number;
  free(ptr: number): void;
  HEAPF64: Float64Array;
  HEAP8: Int8Array;
}

export interface HMMModule {
  viterbi_decode(
    observations: number, obs_len: number,
    transitions: number, emissions: number,
    initial_probs: number, num_states: number
  ): number;
  forward_algorithm(
    observations: number, obs_len: number,
    transitions: number, emissions: number,
    initial_probs: number, num_states: number
  ): number;
  malloc(size: number): number;
  free(ptr: number): void;
  HEAPF64: Float64Array;
  HEAP8: Int8Array;
}

export interface AudioProcessorModule {
  process_audio_features(
    audio_data: number, data_len: number,
    sample_rate: number, frame_size: number
  ): number;
  extract_mfcc(
    spectrum: number, spectrum_len: number,
    sample_rate: number, num_coeffs: number
  ): number;
  malloc(size: number): number;
  free(ptr: number): void;
  HEAPF64: Float64Array;
  HEAP8: Int8Array;
}

declare global {
  interface Window {
    DTWModule: () => Promise<DTWModule>;
    HMMModule: () => Promise<HMMModule>;
    AudioProcessorModule: () => Promise<AudioProcessorModule>;
  }
}
EOF

# Copy WASM files to public directory
cp *.wasm ../../public/wasm/ 2>/dev/null || true

echo "WebAssembly modules built successfully!"
echo "Files generated:"
echo "  - ../../public/wasm/dtw.js"
echo "  - ../../public/wasm/dtw.wasm"
echo "  - ../../public/wasm/hmm.js"
echo "  - ../../public/wasm/hmm.wasm"
echo "  - ../../public/wasm/audio_processor.js"
echo "  - ../../public/wasm/audio_processor.wasm"
echo "  - ../../src/types/wasm.ts"