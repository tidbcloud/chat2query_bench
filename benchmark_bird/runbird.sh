#!/bin/bash

export BASE_URL="https://us-west-2.data.dev.tidbcloud.com/api/v1beta/app/chat2query-EosaVhiP/endpoint"
export PUBLIC_KEY=""
export PRIVATE_KEY=""
export BIRD_SECRET=""
export BIRD_DB_URL="https://data.dev.tidbcloud.com/eda/bird/db"


python3 main.py
cp -r exp_result/turbo_output cp exp_result/turbo_output_kg
bash ./run/run_evaluation.sh
