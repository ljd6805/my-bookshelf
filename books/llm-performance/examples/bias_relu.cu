// Educational scalar-bias CUDA kernel. Build/run instructions: index.html#cuda.
#include <cuda_runtime.h>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>

void check(cudaError_t code, const char* operation) {
    if (code != cudaSuccess) {
        std::fprintf(stderr, "%s: %s\n", operation, cudaGetErrorString(code));
        std::exit(1);
    }
}

__global__ void bias_relu(const float* x, float* y, float bias, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = fmaxf(0.0f, x[i] + bias);
}

int main() {
    constexpr int n = 100, block = 64;
    constexpr float bias = 1.0f;
    std::vector<float> x(n), y(n);
    for (int i = 0; i < n; ++i) x[i] = float(i % 9 - 4);
    float *dx = nullptr, *dy = nullptr;
    check(cudaMalloc(&dx, n * sizeof(float)), "allocate x");
    check(cudaMalloc(&dy, n * sizeof(float)), "allocate y");
    check(cudaMemcpy(dx, x.data(), n * sizeof(float), cudaMemcpyHostToDevice), "copy input");
    bias_relu<<<(n + block - 1) / block, block>>>(dx, dy, bias, n);
    check(cudaGetLastError(), "launch bias_relu");
    check(cudaDeviceSynchronize(), "finish bias_relu");
    check(cudaMemcpy(y.data(), dy, n * sizeof(float), cudaMemcpyDeviceToHost), "copy output");
    int failures = 0;
    for (int i = 0; i < n; ++i) {
        if (std::fabs(y[i] - std::fmax(0.0f, x[i] + bias)) > 1e-6f) ++failures;
    }
    check(cudaFree(dx), "free x");
    check(cudaFree(dy), "free y");
    std::printf("N=%d, blocks=%d, out-of-range threads=%d, failures=%d\n",
                n, (n + block - 1) / block, ((n + block - 1) / block) * block - n, failures);
    return failures ? 1 : 0;
}
