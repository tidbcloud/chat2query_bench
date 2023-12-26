#!/bin/bash

docker run --rm -v ./result:/app/result spider_chat2query python test-suite-sql-eval/evaluation.py --gold spider/test_data/dev_gold.sql --pred result/predict.txt --db ./spider/test_database/
