#!/bin/bash

#BASE_URL="<Your base url copied from step 1>"
#PUBLIC_KEY="<Public key copied from step 1>"
#PRIVATE_KEY="<Private key copied from step 1>"

docker run --rm -v $PWD/data:/app/spider -v $PWD/result:/app/result -e BASE_URL="$BASE_URL" -e PUBLIC_KEY="$PUBLIC_KEY" -e PRIVATE_KEY="$PRIVATE_KEY" spider_chat2query python parse_cases.py --json_file=/app/spider/test.json
