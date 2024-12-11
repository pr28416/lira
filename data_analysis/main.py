import numpy as np
import pandas as pd
from grading import grade_responses
from scipy.stats import ttest_ind


def get_grading_statistical_significance(df):
    def compare_software_groups(df, column_name):
        # Get unique users who used both software
        users = df['User ID'].unique()
        lira_scores = []
        google_scores = []

        for user in users:
            user_data = df[df['User ID'] == user]
            if len(user_data) == 2:  # Only include users who have scores for both software
                lira_score = user_data[user_data['Software'] == 'LiRA'][column_name].values
                google_score = user_data[user_data['Software'] == 'Google Scholar + Google Docs'][column_name].values

                if len(lira_score) > 0 and len(google_score) > 0:
                    lira_scores.append(lira_score[0])
                    google_scores.append(google_score[0])

        if len(lira_scores) > 0 and len(google_scores) > 0:
            stat, p = ttest_ind(lira_scores, google_scores, equal_var=True)
            print(f"\nResults for {column_name}:")
            print("t-statistic:", stat)
            print("p-value:", p)
            print("LiRA mean:", np.mean(lira_scores))
            print("Google Scholar + Docs mean:", np.mean(google_scores))
            print("Number of paired samples:", len(lira_scores))
            print("Statistically significant:", p < 0.05)
            print("--------------------------------")

    # Get all numeric columns except User ID and Software
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    columns_to_analyze = [col for col in numeric_columns if col not in ['User ID']]

    # Compare groups for each numeric column
    for column in columns_to_analyze:
        compare_software_groups(df, column)

def get_statistical_significance(df):
    def compare_groups(df, column_name):
        group1 = df[df["Task"] == "Task 1"][column_name]
        group2 = df[df["Task"] == "Task 2"][column_name]

        # group1 = df[df["Which software did you use?"] == "Google Scholar + Google Docs"][column_name]
        # group2 = df[df["Which software did you use?"] == "LiRA"][column_name]
        group1_mean = group1.mean()
        group2_mean = group2.mean()

        stat, p = ttest_ind(group1, group2, equal_var=True)
        print(f"\nResults for {column_name}:")
        print("t-statistic:", stat)
        print("p-value:", p)
        print("Group 1 mean:", group1_mean)
        print("Group 2 mean:", group2_mean)
        print("Statistically significant:", p < 0.05)
        print("--------------------------------")

    # Get all numeric columns except the software column
    numeric_columns = df.select_dtypes(include=[np.number]).columns

    # Compare groups for each numeric column
    for column in numeric_columns:
        compare_groups(df, column)

def main():
    df = pd.read_csv("./data.csv")
    print(df.head())

    # Run statistical analysis after grading is complete
    grading_df = pd.read_csv("grading.csv")
    get_grading_statistical_significance(grading_df)

if __name__ == "__main__":
    main()
