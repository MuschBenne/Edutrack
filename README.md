# BJB-AB 
Project Repository for Program Design &amp; Data Structures

# Setup

## Requirements
- NodeJS
- Jest (if running testcases)
- This application requires MongoDB to be installed locally on your machine.
Visit this link for instructions:
https://www.mongodb.com/docs/manual/administration/install-community/#std-label-install-mdb-community-edition  

## Clone the repo
```bash
git clone "https://github.com/FrickTown/BJB-AB.git" && cd BJB-AB
```

## Install 
In the root folder:  `BJB-AB/` run:
```bash
npm install
```

# Running
To run the code, you have two alternatives.
One relies on ts-node, and runs the TypeScript code without building and compiling it into JavaScript.
```bash
# Run the TypeScript code directly
npm run ts
# or build the code using tsc --strict and run it using node
npm build;
npm start;
```

# Testing
To run all Jest test cases, simply run
```bash
npm test;
```