# README for Bird Official to Run Evaluation

Below are the steps to run the bird benchmark.

1. Put the database in `data/dev_databases` folder, `dev_gold.sql` in `data/dev_gold.sql`, `dev.json` in `data/dev.json`:

```bash
$ ls data/
dev_databases  dev_gold.sql  dev.json
```

2. Install dependencies:

```bash
$ pip install -r requirements.txt
```

3. Edit the `runbird.sh` file and paste `PUBLIC_KEY`, `PRIVATE_KEY`, `BIRD_SECRET`
variables, and then run the script:

```bash
$ ./runbird.sh
```
