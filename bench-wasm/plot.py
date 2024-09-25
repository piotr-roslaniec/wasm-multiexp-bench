import pandas as pd
import matplotlib.pyplot as plt
import glob


# Function to read and process each CSV file
def read_csv(file_path):
    df = pd.read_csv(file_path)
    df['Source'] = file_path.split('/')[-1]  # Add a column to identify the source file
    return df


# Read all CSV files in the current directory
csv_files = glob.glob('*.csv')
data_frames = [read_csv(file) for file in csv_files]

# Merge all data frames on the 'N' column
merged_df = pd.concat(data_frames)

# Plotting
plt.figure(figsize=(10, 6))

# Plot Average values
for source in merged_df['Source'].unique():
    subset = merged_df[merged_df['Source'] == source]
    plt.plot(subset['N'], subset['Average'], label=f'Average - {source}')

# Plot Median values
# for source in merged_df['Source'].unique():
#     subset = merged_df[merged_df['Source'] == source]
#     plt.plot(subset['N'], subset['Median'], label=f'Median - {source}', linestyle='--')

plt.xlabel('N')
plt.ylabel('Time (ms)')
plt.title('Performance Comparison')
plt.legend()
plt.grid(True)
plt.xscale('log')  # Assuming N is in powers of 2, a log scale might be appropriate
plt.yscale('log')  # If the time values span several orders of magnitude

# Save the plot to a file
plt.savefig('performance_comparison.png')
plt.close()