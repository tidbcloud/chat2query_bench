import argparse
import logging
import json

from tenacity import before_sleep_log, retry, stop_after_attempt, wait_random_exponential

from svc import create_data_summary, query_ai_for_sql, loopv2


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
parser = argparse.ArgumentParser()
parser.add_argument('--json_file', dest='json_file', type=str, help='filepath where includes train, test and table json file.')
parser.add_argument('--output', dest='output', type=str, default='result/predict.txt', help='output file where predicted SQL queries will be printed on')
parser.add_argument('--debug', dest='debug', action='store_true', default=False, help='If set, use small data; used\
 for fast debugging.')
args = parser.parse_args()

def parse_cases(output_writer, json_file):
    count = 0

    with open(json_file) as f:
        result = json.loads(f.read())
        for i in result:
            database = i["db_id"]
            question = i["question"]
            data_summary_id, job_id = setup_context(database)
            loopv2(job_id)
            count += 1
            if args.debug:
               if count > 1:
                   break
            try:
                generated_sql, description, clarified_task, raw_generated_sql, refine_note = query_ai_for_sql(data_summary_id, question)  # noqa

                generated_sql = generated_sql.replace("\t", " ").replace("\n", " ").rstrip(";") + ";"
            except Exception as e:
                logging.exception("failed to query_ai_for_sql: %s, retry after 5 seconds", e)
                generated_sql = "sql not generated"

            output_writer.write(f"{generated_sql}\n")
            output_writer.flush()
            logging.info("=================== count =%s====================", count)


@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(10), before_sleep=before_sleep_log(logger, logging.INFO))
def setup_context(dbname):
    return create_data_summary(dbname)


def run_all_cases():
    output_filename = args.output
    json_file = args.json_file

    with open(output_filename, 'w', newline='') as output_writer:
        parse_cases(output_writer, json_file)


if __name__ == "__main__":
    run_all_cases()
