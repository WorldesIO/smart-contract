# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npm install
npx hardhat compile
# delpoy timeLock
npx hardhat deploy --network arb1 --tags timeLock
# verify timeLock contract
npx hardhat run --network arb1 scripts/verify/timeLock-verify.ts


```
# deploy graph

```shell

npm run prepare:arbtrium

npm run codegen && npm run build 

npm run auth

npm run deploy
```