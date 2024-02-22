# How to run test

## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh js-client/basic-html/fixture
```

## 2. copy paste config from local.json
```bash
cat fixture/local.json
```

## 3. install pre-requisite libraries
```bash
npm i --include=dev
```

## 4. Run local server
```bash
npx serve
```
