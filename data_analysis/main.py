import random

import numpy as np
import pandas as pd
from scipy.stats import ttest_ind


def get_statistical_significance(df):
    def compare_groups(df, column_name):
        group1 = df[df["Software"] == "Google Scholar + Google Docs"][column_name]
        group2 = df[df["Software"] == "LiRA"][column_name]

        # group1 = df[df["Which software did you use?"] == "Google Scholar + Google Docs"][column_name]
        # group2 = df[df["Which software did you use?"] == "LiRA"][column_name]
        group1_mean = group1.mean()
        group2_mean = group2.mean()

        stat, p = ttest_ind(group1, group2, equal_var=True)
        print(f"\nResults for {column_name}:")
        print("t-statistic:", stat)
        print("p-value:", p)
        print("Google Scholar + Google Docs mean:", group1_mean)
        print("LiRA mean:", group2_mean)
        print("Statistically significant:", p < 0.05)
        print("--------------------------------")

    # Get all numeric columns except the software column
    numeric_columns = df.select_dtypes(include=[np.number]).columns

    # Compare groups for each numeric column
    for column in numeric_columns:
        compare_groups(df, column)

def grade_responses(df):
    task1_responses = df[df["Which task did you finish?"] == "Task 1"]
    task2_responses = df[df["Which task did you finish?"] == "Task 2"]

    grading_results = []

    def grade_response_set(responses, task_num, question):
        response_list = responses.to_dict('records')
        random.shuffle(response_list)

        for response in response_list:
            print("\n" + "="*80)
            print(f"\nGrading {task_num} Response:")
            print("\nResponse:")
            print(response[question])

            # Get grades from user
            print("\nBased on the rubric, please enter grades (0-20):")
            lit_coverage = float(input("Basic Literature Coverage (0-20): "))
            problem_scope = float(input("Problem Scope (0-20): "))
            technical_insight = float(input("Technical Insight (0-20): "))
            critical_thinking = float(input("Critical Thinking (0-20): "))
            research_direction = float(input("Research Direction (0-20): "))

            # Store results
            grading_results.append({
                'Task': task_num,
                'Software': response["Which software did you use?"],
                'User ID': response["Name (First, Last)"],
                'Literature Coverage': lit_coverage,
                'Problem Scope': problem_scope,
                'Technical Insight': technical_insight,
                'Critical Thinking': critical_thinking,
                'Research Direction': research_direction,
                'Total Score': lit_coverage + problem_scope + technical_insight + critical_thinking + research_direction,
                'Response': response[question]
            })

            continue_grading = input("\nContinue grading? (y/n): ").lower()
            if continue_grading != 'y':
                break

        return grading_results

    print("\nGrading Task 1 Responses...")
    grade_response_set(
        task1_responses,
        "Task 1",
        "Provide a summary of your current understanding of the research question and what research has already been done based on your review. Be as detailed as possible.\n\nWhat strategies can be used to optimize LLMs for generating culturally relevant responses tailored to a user's region, even when the user does not explicitly provide regional context?"
    )
    print(grading_results)

    print("\nGrading Task 2 Responses...")
    grade_response_set(
        task2_responses,
        "Task 2",
        "Provide a summary of your current understanding of the research question and what research has already been done based on your review. Be as detailed as possible.\n\nWhat are the best practices for designing adaptive user interfaces that personalize based on LLM-generated interactions?"
    )
    print(grading_results)

    # Save results to CSV
    results_df = pd.DataFrame(grading_results)
    results_df.to_csv("grading.csv", index=False)
    print("\nGrading results saved to grading.csv")

def main():
    df = pd.read_csv("./data.csv")
    print(df.head())
    print("Starting grading process...")
    # grade_responses(df)

    # Run statistical analysis after grading is complete
    grading_df = pd.read_csv("grading.csv")
    get_statistical_significance(grading_df)




if __name__ == "__main__":
    main()
