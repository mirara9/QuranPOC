#include <vector>
#include <cmath>
#include <algorithm>
#include <limits>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

struct DTWResult {
    double distance;
    std::vector<std::pair<int, int>> path;
};

class DynamicTimeWarping {
private:
    std::vector<std::vector<double>> costMatrix;
    std::vector<std::vector<int>> pathMatrix;
    
    double euclideanDistance(const std::vector<double>& a, const std::vector<double>& b) {
        if (a.size() != b.size()) {
            return std::numeric_limits<double>::infinity();
        }
        
        double sum = 0.0;
        for (size_t i = 0; i < a.size(); i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return std::sqrt(sum);
    }
    
    double manhattanDistance(const std::vector<double>& a, const std::vector<double>& b) {
        if (a.size() != b.size()) {
            return std::numeric_limits<double>::infinity();
        }
        
        double sum = 0.0;
        for (size_t i = 0; i < a.size(); i++) {
            sum += std::abs(a[i] - b[i]);
        }
        return sum;
    }
    
public:
    DTWResult compute(const std::vector<std::vector<double>>& seq1, 
                     const std::vector<std::vector<double>>& seq2,
                     const std::string& distanceMetric = "euclidean") {
        int n = seq1.size();
        int m = seq2.size();
        
        if (n == 0 || m == 0) {
            return {std::numeric_limits<double>::infinity(), {}};
        }
        
        // Initialize cost matrix
        costMatrix.assign(n + 1, std::vector<double>(m + 1, std::numeric_limits<double>::infinity()));
        pathMatrix.assign(n + 1, std::vector<int>(m + 1, -1));
        
        costMatrix[0][0] = 0.0;
        
        // Fill cost matrix
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                double cost;
                if (distanceMetric == "manhattan") {
                    cost = manhattanDistance(seq1[i-1], seq2[j-1]);
                } else {
                    cost = euclideanDistance(seq1[i-1], seq2[j-1]);
                }
                
                double match = costMatrix[i-1][j-1];
                double insertion = costMatrix[i][j-1];
                double deletion = costMatrix[i-1][j];
                
                double minCost = std::min({match, insertion, deletion});
                costMatrix[i][j] = cost + minCost;
                
                // Track path
                if (minCost == match) {
                    pathMatrix[i][j] = 0; // diagonal
                } else if (minCost == insertion) {
                    pathMatrix[i][j] = 1; // horizontal
                } else {
                    pathMatrix[i][j] = 2; // vertical
                }
            }
        }
        
        // Backtrack to find optimal path
        std::vector<std::pair<int, int>> path;
        int i = n, j = m;
        
        while (i > 0 && j > 0) {
            path.push_back({i-1, j-1});
            
            switch (pathMatrix[i][j]) {
                case 0: // diagonal
                    i--; j--;
                    break;
                case 1: // horizontal
                    j--;
                    break;
                case 2: // vertical
                    i--;
                    break;
            }
        }
        
        std::reverse(path.begin(), path.end());
        
        return {costMatrix[n][m], path};
    }
    
    DTWResult computeConstrained(const std::vector<std::vector<double>>& seq1,
                                const std::vector<std::vector<double>>& seq2,
                                int windowSize) {
        int n = seq1.size();
        int m = seq2.size();
        
        if (n == 0 || m == 0) {
            return {std::numeric_limits<double>::infinity(), {}};
        }
        
        // Sakoe-Chiba band constraint
        costMatrix.assign(n + 1, std::vector<double>(m + 1, std::numeric_limits<double>::infinity()));
        pathMatrix.assign(n + 1, std::vector<int>(m + 1, -1));
        
        costMatrix[0][0] = 0.0;
        
        for (int i = 1; i <= n; i++) {
            int jStart = std::max(1, i - windowSize);
            int jEnd = std::min(m, i + windowSize);
            
            for (int j = jStart; j <= jEnd; j++) {
                double cost = euclideanDistance(seq1[i-1], seq2[j-1]);
                
                double match = costMatrix[i-1][j-1];
                double insertion = costMatrix[i][j-1];
                double deletion = costMatrix[i-1][j];
                
                double minCost = std::min({match, insertion, deletion});
                costMatrix[i][j] = cost + minCost;
                
                if (minCost == match) {
                    pathMatrix[i][j] = 0;
                } else if (minCost == insertion) {
                    pathMatrix[i][j] = 1;
                } else {
                    pathMatrix[i][j] = 2;
                }
            }
        }
        
        // Backtrack
        std::vector<std::pair<int, int>> path;
        int i = n, j = m;
        
        while (i > 0 && j > 0) {
            path.push_back({i-1, j-1});
            
            switch (pathMatrix[i][j]) {
                case 0:
                    i--; j--;
                    break;
                case 1:
                    j--;
                    break;
                case 2:
                    i--;
                    break;
            }
        }
        
        std::reverse(path.begin(), path.end());
        
        return {costMatrix[n][m], path};
    }
    
    double computeNormalizedDistance(const std::vector<std::vector<double>>& seq1,
                                   const std::vector<std::vector<double>>& seq2) {
        DTWResult result = compute(seq1, seq2);
        int pathLength = result.path.size();
        return pathLength > 0 ? result.distance / pathLength : result.distance;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(dtw_module) {
    value_object<std::pair<int, int>>("PathPoint")
        .field("first", &std::pair<int, int>::first)
        .field("second", &std::pair<int, int>::second);
    
    value_object<DTWResult>("DTWResult")
        .field("distance", &DTWResult::distance)
        .field("path", &DTWResult::path);
    
    register_vector<double>("VectorDouble");
    register_vector<std::vector<double>>("VectorVectorDouble");
    register_vector<std::pair<int, int>>("VectorPathPoint");
    
    class_<DynamicTimeWarping>("DynamicTimeWarping")
        .constructor<>()
        .function("compute", &DynamicTimeWarping::compute)
        .function("computeConstrained", &DynamicTimeWarping::computeConstrained)
        .function("computeNormalizedDistance", &DynamicTimeWarping::computeNormalizedDistance);
}

// C-style API for direct calling
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    double compute_dtw_distance(double* seq1, int seq1_len, int feature_dim1,
                               double* seq2, int seq2_len, int feature_dim2) {
        if (feature_dim1 != feature_dim2) {
            return std::numeric_limits<double>::infinity();
        }
        
        std::vector<std::vector<double>> sequence1(seq1_len, std::vector<double>(feature_dim1));
        std::vector<std::vector<double>> sequence2(seq2_len, std::vector<double>(feature_dim2));
        
        for (int i = 0; i < seq1_len; i++) {
            for (int j = 0; j < feature_dim1; j++) {
                sequence1[i][j] = seq1[i * feature_dim1 + j];
            }
        }
        
        for (int i = 0; i < seq2_len; i++) {
            for (int j = 0; j < feature_dim2; j++) {
                sequence2[i][j] = seq2[i * feature_dim2 + j];
            }
        }
        
        DynamicTimeWarping dtw;
        DTWResult result = dtw.compute(sequence1, sequence2);
        return result.distance;
    }
    
    EMSCRIPTEN_KEEPALIVE
    double compute_normalized_dtw(double* seq1, int seq1_len, int feature_dim1,
                                 double* seq2, int seq2_len, int feature_dim2) {
        if (feature_dim1 != feature_dim2) {
            return std::numeric_limits<double>::infinity();
        }
        
        std::vector<std::vector<double>> sequence1(seq1_len, std::vector<double>(feature_dim1));
        std::vector<std::vector<double>> sequence2(seq2_len, std::vector<double>(feature_dim2));
        
        for (int i = 0; i < seq1_len; i++) {
            for (int j = 0; j < feature_dim1; j++) {
                sequence1[i][j] = seq1[i * feature_dim1 + j];
            }
        }
        
        for (int i = 0; i < seq2_len; i++) {
            for (int j = 0; j < feature_dim2; j++) {
                sequence2[i][j] = seq2[i * feature_dim2 + j];
            }
        }
        
        DynamicTimeWarping dtw;
        return dtw.computeNormalizedDistance(sequence1, sequence2);
    }
}