#!/bin/bash

python parse_cases.py --json_filepath=./spider/test_data/dev.json
python test-suite-sql-eval/evaluation.py --gold spider/test_data/dev_gold.sql --pred result/predict.txt --db ./spider/test_database/
