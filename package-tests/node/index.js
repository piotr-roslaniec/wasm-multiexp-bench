const { bench_ark_bn254, bench_halo2curves_bn254 } = require("crate/node");

bench_ark_bn254(1, 1);
bench_halo2curves_bn254(1, 1);

console.log("node test passed");
