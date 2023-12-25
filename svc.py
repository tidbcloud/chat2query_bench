import os
import time
import logging

import requests
from requests.auth import HTTPDigestAuth
from tenacity import before_sleep_log, retry, stop_after_attempt, wait_random_exponential

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


base_url = os.getenv("BASE_URL")
digest_auth = HTTPDigestAuth(os.getenv("PUBLIC_KEY"), os.getenv("PRIVATE_KEY"))


@retry(wait=wait_random_exponential(min=1, max=5), stop=stop_after_attempt(3), before_sleep=before_sleep_log(logger, logging.INFO))
def query_ai_for_sql(data_summary_id, raw_question):
    job_id = chat2data(data_summary_id, raw_question)
    logging.info("job_id is %s, data_summary_id %s, raw_question %s", job_id, data_summary_id, raw_question)

    count = 0
    while True:
        try:
            count += 1
            result = query_job_detail(job_id)

            if result["status"] == "done":
                inner_result = result["result"]["task_tree"]
                for k, v in inner_result.items():
                    if "sql" in v:
                        return v["sql"], v["description"], v["clarified_task"], v.get("raw_generated_sql", ""), v.get("refine_note", "")  # noqa
                logging.info("sql not found, detail: %s", result)
                raise ValueError("sql not found in job result")

            if result["status"] == "failed":
                logging.info("job failed, detail: %s", result)
                raise ValueError("job failed because of ai error")

            if count > 300:
                logging.info("job failed because of timeout, detail: %s", result)
                raise ValueError("job failed because of too many retries")
        except ValueError as e:
            logging.info("raise ValueError, detail: %s", str(e))
            raise
        except Exception as e:
            logging.exception("failed to query job detail: %s", str(e))
        finally:
            time.sleep(5)


def create_data_summary(dbname: str):
    url = f"{base_url}/v2/dataSummaries"
    database_uri = f"spider://{dbname}"

    payload = {
        "database_uri": database_uri,
    }

    resp = requests.post(url, json=payload, auth=digest_auth)
    logging.info("create_data_summary %s got %s", payload, resp.text)
    resp.raise_for_status()

    resp_json = resp.json()
    return resp_json["result"]["data_summary_id"], resp_json["result"]["job_id"]


def chat2data(data_summary_id: int, question: str):
    url = f"{base_url}/v2/chat2data"
    payload = {
        "data_summary_id": data_summary_id,
        "raw_question": question
    }
    resp = requests.post(url, json=payload, auth=digest_auth)
    logging.info("chat2data with %s got %s", payload, resp.text)
    resp.raise_for_status()

    resp_json = resp.json()
    return resp_json["result"]["job_id"]


def query_job_detail(job_id):
    url = f"{base_url}/v2/jobs/{job_id}"
    resp = requests.get(url, auth=digest_auth)
    logging.info("get job %s detail got resp %s", job_id, resp.text)
    resp.raise_for_status()

    return resp.json()["result"]


def loopv2(job_id: str):
    for _ in range(10000):
        try:
            result = query_job_detail(job_id)
            if result["status"] in ("done", "failed"):
                break
        except Exception as e:
            logging.exception("failed to query job detail: %s", e)
            time.sleep(5)
