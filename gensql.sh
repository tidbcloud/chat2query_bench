#!/bin/bash

#BASE_URL="<Your base url copied from step 1>"
#PUBLIC_KEY="<Public key copied from step 1>"
#PRIVATE_KEY="<Private key copied from step 1>"
BASE_URL="https://data.dev.tidbcloud.com/api/v1beta/app/chat2query-ZzeDsdYb/endpoint"
PUBLIC_KEY="G0T3MLC0"
PRIVATE_KEY="591f259e-1006-4e22-ade6-d791b3b1d95a"


docker run --rm -v $PWD/spider:/app/spider -v $PWD/result:/app/result -e BASE_URL="$BASE_URL" -e PUBLIC_KEY="$PUBLIC_KEY" -e PRIVATE_KEY="$PRIVATE_KEY" spider_chat2query python parse_cases.py --json_file=/app/spider/test_data/dev.json
