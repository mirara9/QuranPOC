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