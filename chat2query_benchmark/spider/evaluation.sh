#!/bin/bash

docker run --rm -v $PWD/data:/app/spider -v $PWD/result:/app/result spider_chat2query python test-suite-sql-eval/evaluation.py --gold spider/test_gold.sql --pred result/predict.txt --db spider/test_database/
