# How to run test

## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh js-client/basic-html
```

## 2. install pre-requisite libraries
```bash
npm run workspace:prepare
npm i --include=dev
```

## 4. Run local server
```bash
npm run start
```

## 5. Visit page

[http://localhost:3000/](http://localhost:3000/)
