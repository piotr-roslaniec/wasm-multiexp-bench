#[cfg(test)]
mod test {
    use wasm_bindgen_test::{wasm_bindgen_test, wasm_bindgen_test_configure};
    use wasm_multiexp_bench::wasm_test::wasm_sanity_check;

    wasm_bindgen_test_configure!(run_in_dedicated_worker);

    #[wasm_bindgen_test]
    fn test_wasm_sanity_check() { wasm_sanity_check(); }
}
