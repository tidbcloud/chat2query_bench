#!/bin/bash
set -e
set -x
export BASE_URL="https://data.tidbcloud.com/api/v1beta/app/chat2query-QMczxawY/endpoint"
export PUBLIC_KEY="S0TJCCU0"
export PRIVATE_KEY="8817ad91-e271-4826-90fd-ea9ad9a3e020"
python3 /app/parse_cases.py --debug --json_file=./spider/spider/test_data/dev.json --output predict.txt
