use ark_std::{rand::SeedableRng, UniformRand};

use serde::{Deserialize, Serialize};
use serde_wasm_bindgen;
use wasm_bindgen::prelude::*;
#[cfg(feature = "multithreading")]
pub use wasm_bindgen_rayon::init_thread_pool;
use web_time::Instant;

#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct BenchmarkResult {
    pub n:          u32,
    pub average_ms: f64,
    pub median_ms:  f64,
}

#[wasm_bindgen]
pub fn bench_ark_bn254(n: u32, test_cases: u32) -> Result<JsValue, JsValue> {
    use ark_bn254::{Fr, G1Affine, G1Projective};
    use ark_ec::{CurveGroup, VariableBaseMSM};

    let mut results = Vec::new();

    // Use a fixed seed for reproducibility
    let mut rng = ark_std::rand::rngs::StdRng::seed_from_u64(n as u64);

    // Setup scalars and points
    let scalars: Vec<Fr> = (0..n).map(|_| Fr::rand(&mut rng)).collect();
    let points: Vec<G1Affine> =
        (0..n).map(|_| G1Projective::rand(&mut rng).into_affine()).collect();

    let mut test_results = Vec::with_capacity(test_cases as usize);

    for _ in 0..test_cases {
        let start = Instant::now();
        let result = G1Projective::msm(&points, &scalars)?;
        let elapsed = start.elapsed();
        test_results.push(elapsed.as_secs_f64() * 1000.0);

        // Use the result to prevent optimization
        let _ = std::hint::black_box(result);
    }

    test_results.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let avg = test_results.iter().sum::<f64>() / test_results.len() as f64;
    let median = test_results[test_results.len() / 2];

    results.push(BenchmarkResult { n, average_ms: avg, median_ms: median });

    // Serialize results to JSON
    serde_wasm_bindgen::to_value(&results).map_err(|e| JsValue::from(e.to_string()))
}

#[wasm_bindgen]
pub fn bench_halo2curves_bn254(n: u32, test_cases: u32) -> Result<JsValue, JsValue> {
    use ark_std::rand;
    use halo2curves::{
        bn256::Fr,
        group::{Curve, Group},
        msm::best_multiexp,
    };
    use halo2curves::{
        bn256::{G1Affine, G1},
        ff::Field,
    };

    let mut results = Vec::new();

    // Use a fixed seed for reproducibility
    let mut rng = rand::rngs::StdRng::seed_from_u64(n as u64);

    let scalars: Vec<Fr> = (0..n).map(|_| Fr::random(&mut rng)).collect();
    let points: Vec<G1Affine> = (0..n).map(|_| G1::random(&mut rng).to_affine()).collect();
    let mut test_results = Vec::with_capacity(test_cases as usize);

    for _ in 0..test_cases {
        let start = Instant::now();
        let result = best_multiexp(&scalars, &points);
        let elapsed = start.elapsed();
        test_results.push(elapsed.as_secs_f64() * 1000.0);

        // Use the result to prevent compiler optimizations
        let _ = std::hint::black_box(result);
    }

    test_results.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let average = test_results.iter().sum::<f64>() / test_results.len() as f64;
    let median = test_results[test_results.len() / 2];

    results.push(BenchmarkResult { n, average_ms: average, median_ms: median });

    // Serialize results to JSON
    serde_wasm_bindgen::to_value(&results).map_err(|e| JsValue::from(e.to_string()))
}
pub mod wasm_test {
    pub fn wasm_sanity_check() {
        crate::bench_ark_bn254(1, 1).unwrap();
        crate::bench_halo2curves_bn254(1, 1).unwrap();
    }
}
