import argparse
import csv
import logging
import json

from tenacity import before_sleep_log, retry, stop_after_attempt, wait_random_exponential

from svc import create_data_summary, query_ai_for_sql, loopv2


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
parser = argparse.ArgumentParser()
parser.add_argument('--json_filepath', dest='json_filepath', type=str, help='filepath where includes train, test and table json file.')
parser.add_argument('--output', dest='output', type=str, default='result/predict.txt', help='output file where predicted SQL queries will be printed on')

args = parser.parse_args()


def parse_cases(output_writer, json_filepath):
    count = 0

    with open(json_filepath) as f:
        result = json.loads(f.read())
        for i in result:
            database = i["db_id"]
            question = i["question"]
            data_summary_id, job_id = setup_context(database)
            loopv2(job_id)


            while True:
                try:
                    generated_sql, description, clarified_task, raw_generated_sql, refine_note = query_ai_for_sql(data_summary_id, question)  # noqa
                    if not generated_sql:
                        logging.warning(
                            "no sql found, data_summary_id %s, std spider args %s, results %s, %s, %s, %s, %s",
                            data_summary_id, i, generated_sql, description, clarified_task, raw_generated_sql, refine_note,  # noqa
                        )
                        generated_sql = "sql not found"

                    generated_sql = generated_sql.replace("\t", " ").replace("\n", " ") + ";"

                    count += 1
                    output_writer.write(f"{generated_sql}\n")
                    output_writer.flush()
                    # create_test_case(plan_id, question, database, "", sql, [])
                    logging.info("=================== count =%s====================", count)
                    break
                except Exception as e:
                    logging.exception("failed to query_ai_for_sql: %s, retry after 5 seconds", e)


@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(10), before_sleep=before_sleep_log(logger, logging.INFO))
def setup_context(dbname):
    return create_data_summary(dbname)


def run_all_cases():
    output_filename = args.output
    json_filepath = args.json_filepath

    with open(output_filename, 'w', newline='') as output_writer:
        parse_cases(output_writer, json_filepath)


if __name__ == "__main__":
    run_all_cases()
