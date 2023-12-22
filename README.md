# Spider for Chat2Query

## Step 1: Create a new Chat2Query App in TiDB Cloud

## Step 2: Create Admin API Key

## Step 3: Set your own OpenAI API Key

## Step 4: Run the benchmark

```bash
$ docker build . -t spider_chat2query
$ docker run --rm  -e BASE_URL="" -e PUBLIC_KEY="" -e PRIVATE_KEY="" spider_chat2query /app/evaluation.sh
```
