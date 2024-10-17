import re
import matplotlib.pyplot as plt
import os

# Define the directory for benchmark results
RESULTS_DIR = './bench-results'

# Ensure the output directory exists
os.makedirs(RESULTS_DIR, exist_ok=True)

# Function to extract the benchmark data from the markdown file
def extract_benchmark_data(filename):
    data = {}
    with open(filename, 'r') as file:
        lines = file.readlines()

    for line in lines:
        match = re.match(r'\|\s*(ffjavascript|arkworks)\s*\|\s*([\d\.]+)\s*\([\d\.%]+\)\s*\|\s*([\d\.]+)\s*\([\d\.%]+\)\s*\|\s*(\w+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|', line)
        if match:
            method = match.group(1)
            avg_time = float(match.group(2))
            median_time = float(match.group(3))
            benchmark = match.group(4)
            test_cases = match.group(5)
            threads = int(match.group(6))  # Convert threads to int
            n = match.group(7)

            key = (benchmark, test_cases, threads, n)
            if key not in data:
                data[key] = {}
            data[key][method] = (avg_time, median_time)

    return data

# Function to combine the data from both files
def combine_benchmark_data(old_data, new_data):
    combined_data = []
    for key in old_data.keys():
        if key in new_data:
            old_arkworks = old_data[key].get('arkworks', ('N/A', 'N/A'))
            new_arkworks = new_data[key].get('arkworks', ('N/A', 'N/A'))
            ffjavascript = old_data[key].get('ffjavascript', ('N/A', 'N/A'))  # assuming ffjavascript is the same in both
            combined_data.append((key, ffjavascript, old_arkworks, new_arkworks))
    return combined_data

# Function to write the combined data back into markdown format
def write_combined_markdown(combined_data, output_file):
    with open(output_file, 'w') as file:
        file.write("| Method       | Average Time (ms)  | Median Time (ms)   | Benchmark | Test Cases | Threads   | N     |\n")
        file.write("| ------------ | ------------------ | ------------------ | --------- | ---------- | --------- | ----- |\n")

        for (benchmark, test_cases, threads, n), ffjavascript, old_arkworks, new_arkworks in combined_data:
            file.write(f"| ffjavascript | {ffjavascript[0]} (0.00%) | {ffjavascript[1]} (0.00%) | {benchmark} | {test_cases} | {threads} | {n} |\n")
            file.write(f"| arkworks-old | {old_arkworks[0]} | {old_arkworks[1]} | {benchmark} | {test_cases} | {threads} | {n} |\n")
            file.write(f"| arkworks-new | {new_arkworks[0]} | {new_arkworks[1]} | {benchmark} | {test_cases} | {threads} | {n} |\n")

# Function to plot performance with respect to the number of threads
def plot_performance(combined_data, output_image):
    threads = []
    ffjavascript_times = []
    old_arkworks_times = []
    new_arkworks_times = []

    for (benchmark, test_cases, threads_count, n), ffjavascript, old_arkworks, new_arkworks in combined_data:
        threads.append(threads_count)
        ffjavascript_times.append(ffjavascript[0])
        old_arkworks_times.append(old_arkworks[0])
        new_arkworks_times.append(new_arkworks[0])

    # Plot the data
    plt.figure(figsize=(10, 6))
    plt.plot(threads, ffjavascript_times, label='ffjavascript', marker='o', linestyle='-')
    plt.plot(threads, old_arkworks_times, label='ark-*@0.5.x', marker='x', linestyle='--')
    plt.plot(threads, new_arkworks_times, label='ark-*@0.4.x', marker='s', linestyle='-.')

    plt.xlabel('Number of Threads')
    plt.ylabel('Average Time (ms)')
    plt.title('Performance Comparison of Methods by Number of Threads')
    plt.legend()
    plt.grid(True)

    # Save plot to file in the results directory
    plt.savefig(output_image)
    plt.close()

# Define input files
old_benchmark_file = os.path.join(RESULTS_DIR, 'BENCHMARK-old.md')
new_benchmark_file = os.path.join(RESULTS_DIR, 'BENCHMARK-new.md')

# Read data from both files
old_data = extract_benchmark_data(old_benchmark_file)
new_data = extract_benchmark_data(new_benchmark_file)

# Combine the data
combined_data = combine_benchmark_data(old_data, new_data)

# Write the combined data to a new markdown file in the results directory
combined_markdown_file = os.path.join(RESULTS_DIR, 'BENCHMARK-combined.md')
write_combined_markdown(combined_data, combined_markdown_file)

# Plot the performance comparison
plot_image_file = os.path.join(RESULTS_DIR, 'performance_comparison.png')
plot_performance(combined_data, plot_image_file)

print(f"Combined markdown file written to {combined_markdown_file}")
print(f"Performance plot written to {plot_image_file}")
