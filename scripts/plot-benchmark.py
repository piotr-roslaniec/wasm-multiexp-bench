import os
import json
import matplotlib.pyplot as plt

RESULTS_DIR = 'bench-results'


def extract_benchmark_from_result_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
        result = data["result"]
        meta_data = data["metaData"]["config"]

        method = meta_data["method"]
        average_time = result["average_ms"]
        median_time = result["median_ms"]
        benchmark = data["metaData"]["project"]
        test_cases = meta_data["testCases"]
        threads = meta_data["threads"] if "threads" in meta_data else 1
        n = meta_data["n"]

        return (method, average_time, median_time, benchmark, test_cases, threads, n)


def extract_benchmark_data_from_dir(directory):
    data = {}
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.result.txt'):
                file_path = os.path.join(root, file)
                benchmark_result = extract_benchmark_from_result_file(file_path)
                method, avg_time, median_time, benchmark, test_cases, threads, n = benchmark_result

                key = (benchmark, test_cases, threads, n)
                if key not in data:
                    data[key] = {}
                data[key][method] = (avg_time, median_time)
    return data


def combine_benchmark_data(old_data, new_data):
    combined_data = []
    for key in old_data.keys():
        if key in new_data:
            old_arkworks = old_data[key]['arkworks']
            new_arkworks = new_data[key]['arkworks']
            ffjavascript = old_data[key]['ffjavascript']
            combined_data.append((key, ffjavascript, old_arkworks, new_arkworks))
        else:
            raise Exception('Could not find a corresponding benchmark: ' + str(key))
    return combined_data


def write_combined_markdown(combined_data, output_file):
    # Sort combined data by threads first, then by method name
    combined_data.sort(key=lambda x: (x[0][2], 'ffjavascript', 'arkworks-old', 'arkworks-new'))

    with open(output_file, 'w') as file:
        # Write header
        file.write("| Method       | Average Time (ms)  | Median Time (ms)   | Benchmark | Test Cases | Threads   | N     |\n")
        file.write("| ------------ | ------------------ | ------------------ | --------- | ---------- | --------- | ----- |\n")

        for (benchmark, test_cases, threads, n), ffjavascript, old_arkworks, new_arkworks in combined_data:
            file.write(f"| ffjavascript | {ffjavascript[0]:.2f} | {ffjavascript[1]:.2f} | {benchmark} | {test_cases} | {threads} | {n} |\n")
            file.write(f"| arkworks-old | {old_arkworks[0]:.2f} | {old_arkworks[1]:.2f} | {benchmark} | {test_cases} | {threads} | {n} |\n")
            file.write(f"| arkworks-new | {new_arkworks[0]:.2f} | {new_arkworks[1]:.2f} | {benchmark} | {test_cases} | {threads} | {n} |\n")


def plot_performance(combined_data, output_image):
    # Sort combined data by the number of threads (3rd element of the key tuple)
    combined_data.sort(key=lambda x: x[0][2])

    threads = []
    ffjavascript_times = []
    old_arkworks_times = []
    new_arkworks_times = []

    for (benchmark, test_cases, threads_count, n), ffjavascript, old_arkworks, new_arkworks in combined_data:
        threads.append(threads_count)
        ffjavascript_times.append(ffjavascript[0])
        old_arkworks_times.append(old_arkworks[0])
        new_arkworks_times.append(new_arkworks[0])

    # Plot the data with thread count as x-axis labels
    plt.figure(figsize=(10, 6))
    plt.plot(threads, ffjavascript_times, label='ffjavascript', marker='o', linestyle='-')
    plt.plot(threads, old_arkworks_times, label='ark-*@0.4.x', marker='x', linestyle='--')
    plt.plot(threads, new_arkworks_times, label='ark-*@0.5.x', marker='s', linestyle='-.')

    plt.xticks(threads)  # Set the x-axis ticks to be the thread counts

    plt.xlabel('Number of Threads')
    plt.ylabel('Average Time (ms)')
    plt.title('Performance Comparison of Methods by Number of Threads')
    plt.legend()
    plt.grid(True)

    # Save the plot
    plt.savefig(output_image)
    plt.close()


# Main script execution
pw_outputs_old = os.path.join(RESULTS_DIR, 'pw-outputs-old')
pw_outputs_new = os.path.join(RESULTS_DIR, 'pw-outputs-new')

old_data = extract_benchmark_data_from_dir(pw_outputs_old)
new_data = extract_benchmark_data_from_dir(pw_outputs_new)

combined_data = combine_benchmark_data(old_data, new_data)

# Write the combined results to a markdown file
combined_markdown_file = os.path.join(RESULTS_DIR, 'benchmark-combined.md')
write_combined_markdown(combined_data, combined_markdown_file)

# Plot the performance comparison
plot_image_file = os.path.join(RESULTS_DIR, 'performance_comparison.png')
plot_performance(combined_data, plot_image_file)

print(f"Combined markdown file written to {combined_markdown_file}")
print(f"Performance plot written to {plot_image_file}")
