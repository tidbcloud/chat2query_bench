# README for Bird Official to Run Evaluation

Below are the steps to run the bird benchmark.

Put the database in `data/dev_databases` folder, `dev_gold.sql` in `data/dev_gold.sql`, `dev.json` in `data/dev.json`:

```bash
$ ls data/
dev_databases  dev_gold.sql  dev.json
```

Edit the `runbird.sh` file and paste `PUBLIC_KEY`, `PRIVATE_KEY`, `BIRD_SECRET`
variables, and then run the script:

```bash
$ ./runbird.sh
```
