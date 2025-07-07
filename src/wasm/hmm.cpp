#include <vector>
#include <cmath>
#include <algorithm>
#include <limits>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

struct ViterbiResult {
    std::vector<int> path;
    double probability;
    std::vector<double> probabilities;
};

struct ForwardResult {
    double probability;
    std::vector<std::vector<double>> alpha;
};

class HiddenMarkovModel {
private:
    int numStates;
    int numObservations;
    std::vector<std::vector<double>> transitionMatrix;
    std::vector<std::vector<double>> emissionMatrix;
    std::vector<double> initialProbabilities;
    
    double logSum(double logA, double logB) {
        if (logA == -std::numeric_limits<double>::infinity()) return logB;
        if (logB == -std::numeric_limits<double>::infinity()) return logA;
        
        if (logA > logB) {
            return logA + std::log(1.0 + std::exp(logB - logA));
        } else {
            return logB + std::log(1.0 + std::exp(logA - logB));
        }
    }
    
public:
    HiddenMarkovModel(int states, int observations) 
        : numStates(states), numObservations(observations) {
        transitionMatrix.resize(states, std::vector<double>(states, 0.0));
        emissionMatrix.resize(states, std::vector<double>(observations, 0.0));
        initialProbabilities.resize(states, 0.0);
    }
    
    void setTransitionMatrix(const std::vector<std::vector<double>>& transitions) {
        transitionMatrix = transitions;
    }
    
    void setEmissionMatrix(const std::vector<std::vector<double>>& emissions) {
        emissionMatrix = emissions;
    }
    
    void setInitialProbabilities(const std::vector<double>& initial) {
        initialProbabilities = initial;
    }
    
    ViterbiResult viterbi(const std::vector<int>& observations) {
        int T = observations.size();
        if (T == 0) {
            return {{}, -std::numeric_limits<double>::infinity(), {}};
        }
        
        // Initialize probability and path matrices
        std::vector<std::vector<double>> delta(T, std::vector<double>(numStates));
        std::vector<std::vector<int>> psi(T, std::vector<int>(numStates));
        
        // Initialization (t = 0)
        for (int i = 0; i < numStates; i++) {
            if (observations[0] < numObservations) {
                delta[0][i] = std::log(initialProbabilities[i]) + 
                             std::log(emissionMatrix[i][observations[0]]);
            } else {
                delta[0][i] = -std::numeric_limits<double>::infinity();
            }
            psi[0][i] = 0;
        }
        
        // Recursion
        for (int t = 1; t < T; t++) {
            for (int j = 0; j < numStates; j++) {
                double maxProb = -std::numeric_limits<double>::infinity();
                int maxState = 0;
                
                for (int i = 0; i < numStates; i++) {
                    double prob = delta[t-1][i] + std::log(transitionMatrix[i][j]);
                    if (prob > maxProb) {
                        maxProb = prob;
                        maxState = i;
                    }
                }
                
                if (observations[t] < numObservations) {
                    delta[t][j] = maxProb + std::log(emissionMatrix[j][observations[t]]);
                } else {
                    delta[t][j] = -std::numeric_limits<double>::infinity();
                }
                psi[t][j] = maxState;
            }
        }
        
        // Termination
        double maxProb = -std::numeric_limits<double>::infinity();
        int maxState = 0;
        
        for (int i = 0; i < numStates; i++) {
            if (delta[T-1][i] > maxProb) {
                maxProb = delta[T-1][i];
                maxState = i;
            }
        }
        
        // Path backtracking
        std::vector<int> path(T);
        path[T-1] = maxState;
        
        for (int t = T-2; t >= 0; t--) {
            path[t] = psi[t+1][path[t+1]];
        }
        
        // Extract probabilities for each time step
        std::vector<double> probabilities(T);
        for (int t = 0; t < T; t++) {
            probabilities[t] = delta[t][path[t]];
        }
        
        return {path, maxProb, probabilities};
    }
    
    ForwardResult forward(const std::vector<int>& observations) {
        int T = observations.size();
        if (T == 0) {
            return {-std::numeric_limits<double>::infinity(), {}};
        }
        
        std::vector<std::vector<double>> alpha(T, std::vector<double>(numStates));
        
        // Initialization
        for (int i = 0; i < numStates; i++) {
            if (observations[0] < numObservations) {
                alpha[0][i] = std::log(initialProbabilities[i]) + 
                             std::log(emissionMatrix[i][observations[0]]);
            } else {
                alpha[0][i] = -std::numeric_limits<double>::infinity();
            }
        }
        
        // Recursion
        for (int t = 1; t < T; t++) {
            for (int j = 0; j < numStates; j++) {
                alpha[t][j] = -std::numeric_limits<double>::infinity();
                
                for (int i = 0; i < numStates; i++) {
                    double prob = alpha[t-1][i] + std::log(transitionMatrix[i][j]);
                    alpha[t][j] = logSum(alpha[t][j], prob);
                }
                
                if (observations[t] < numObservations) {
                    alpha[t][j] += std::log(emissionMatrix[j][observations[t]]);
                } else {
                    alpha[t][j] = -std::numeric_limits<double>::infinity();
                }
            }
        }
        
        // Termination
        double totalProb = -std::numeric_limits<double>::infinity();
        for (int i = 0; i < numStates; i++) {
            totalProb = logSum(totalProb, alpha[T-1][i]);
        }
        
        return {totalProb, alpha};
    }
    
    std::vector<std::vector<double>> backward(const std::vector<int>& observations) {
        int T = observations.size();
        std::vector<std::vector<double>> beta(T, std::vector<double>(numStates));
        
        // Initialization
        for (int i = 0; i < numStates; i++) {
            beta[T-1][i] = 0.0; // log(1) = 0
        }
        
        // Recursion
        for (int t = T-2; t >= 0; t--) {
            for (int i = 0; i < numStates; i++) {
                beta[t][i] = -std::numeric_limits<double>::infinity();
                
                for (int j = 0; j < numStates; j++) {
                    double prob = std::log(transitionMatrix[i][j]) + 
                                 std::log(emissionMatrix[j][observations[t+1]]) + 
                                 beta[t+1][j];
                    beta[t][i] = logSum(beta[t][i], prob);
                }
            }
        }
        
        return beta;
    }
    
    double calculateLikelihood(const std::vector<int>& observations) {
        ForwardResult result = forward(observations);
        return result.probability;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(hmm_module) {
    value_object<ViterbiResult>("ViterbiResult")
        .field("path", &ViterbiResult::path)
        .field("probability", &ViterbiResult::probability)
        .field("probabilities", &ViterbiResult::probabilities);
    
    value_object<ForwardResult>("ForwardResult")
        .field("probability", &ForwardResult::probability)
        .field("alpha", &ForwardResult::alpha);
    
    register_vector<int>("VectorInt");
    register_vector<double>("VectorDouble");
    register_vector<std::vector<double>>("VectorVectorDouble");
    
    class_<HiddenMarkovModel>("HiddenMarkovModel")
        .constructor<int, int>()
        .function("setTransitionMatrix", &HiddenMarkovModel::setTransitionMatrix)
        .function("setEmissionMatrix", &HiddenMarkovModel::setEmissionMatrix)
        .function("setInitialProbabilities", &HiddenMarkovModel::setInitialProbabilities)
        .function("viterbi", &HiddenMarkovModel::viterbi)
        .function("forward", &HiddenMarkovModel::forward)
        .function("backward", &HiddenMarkovModel::backward)
        .function("calculateLikelihood", &HiddenMarkovModel::calculateLikelihood);
}

// C-style API
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int* viterbi_decode(int* observations, int obs_len,
                       double* transitions, double* emissions,
                       double* initial_probs, int num_states) {
        HiddenMarkovModel hmm(num_states, 256); // Assume max 256 observation symbols
        
        // Set up matrices
        std::vector<std::vector<double>> trans(num_states, std::vector<double>(num_states));
        std::vector<std::vector<double>> emiss(num_states, std::vector<double>(256));
        std::vector<double> initial(num_states);
        
        for (int i = 0; i < num_states; i++) {
            for (int j = 0; j < num_states; j++) {
                trans[i][j] = transitions[i * num_states + j];
            }
            for (int j = 0; j < 256; j++) {
                emiss[i][j] = emissions[i * 256 + j];
            }
            initial[i] = initial_probs[i];
        }
        
        hmm.setTransitionMatrix(trans);
        hmm.setEmissionMatrix(emiss);
        hmm.setInitialProbabilities(initial);
        
        // Convert observations
        std::vector<int> obs(obs_len);
        for (int i = 0; i < obs_len; i++) {
            obs[i] = observations[i];
        }
        
        // Perform Viterbi decoding
        ViterbiResult result = hmm.viterbi(obs);
        
        // Allocate result array
        int* path = (int*)malloc(obs_len * sizeof(int));
        for (int i = 0; i < obs_len; i++) {
            path[i] = result.path[i];
        }
        
        return path;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double forward_algorithm(int* observations, int obs_len,
                            double* transitions, double* emissions,
                            double* initial_probs, int num_states) {
        HiddenMarkovModel hmm(num_states, 256);
        
        // Set up matrices
        std::vector<std::vector<double>> trans(num_states, std::vector<double>(num_states));
        std::vector<std::vector<double>> emiss(num_states, std::vector<double>(256));
        std::vector<double> initial(num_states);
        
        for (int i = 0; i < num_states; i++) {
            for (int j = 0; j < num_states; j++) {
                trans[i][j] = transitions[i * num_states + j];
            }
            for (int j = 0; j < 256; j++) {
                emiss[i][j] = emissions[i * 256 + j];
            }
            initial[i] = initial_probs[i];
        }
        
        hmm.setTransitionMatrix(trans);
        hmm.setEmissionMatrix(emiss);
        hmm.setInitialProbabilities(initial);
        
        // Convert observations
        std::vector<int> obs(obs_len);
        for (int i = 0; i < obs_len; i++) {
            obs[i] = observations[i];
        }
        
        // Perform forward algorithm
        ForwardResult result = hmm.forward(obs);
        return result.probability;
    }
}