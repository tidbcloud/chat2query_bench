#!/bin/bash

export BASE_URL=""
export PUBLIC_KEY=""
export PRIVATE_KEY=""


python3 main.py
cp -r exp_result/turbo_output cp exp_result/turbo_output_kg
bash ./run/run_evaluation.sh
