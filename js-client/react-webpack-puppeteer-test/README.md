# 🔥 🥵 This test is kinda broken and kinda workin' 🫠

The headful test succeeds, the headless test times out.

# How to run test

## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh js-client/react-webpack-puppeteer-test
```

## 2. install pre-requisite libraries
```bash
npm i --include=dev
```

## 3a. Run headless
```bash
npm run test:headless
```

## OR 3b. Run headful
```bash
npm run test:headful
```

## OR 3c. Run interactive - port 9000
```bash
npm run start
```
