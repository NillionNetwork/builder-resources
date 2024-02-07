# How to run test

## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh js-client/jasmine-test/src/fixture
```

## 2. install pre-requisite libraries
```bash
npm i --include=dev
```

## 3a. Run headless
```bash
npm run test
```

## OR 3b. Run headful
```bash
npm run test-interactive
```
