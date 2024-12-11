import random

import pandas as pd


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


if __name__ == "__main__":
    df = pd.read_csv("./data.csv")
    grade_responses(df)
