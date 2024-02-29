# 🔥 🥵 This test is kinda broken and kinda workin' 🫠

There's a known issue of panics happening in the client subsystem that signal failure. The calls do, however, 
complete so it is possible to build on this example.

# How to run test

## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh js-client/react-webpack-puppeteer-test
```

## 2. install pre-requisite libraries
```bash
npm run workspace:prepare
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
