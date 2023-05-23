module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["./**/?(*.)+(integration|unit).ts"],
  roots: ["./src"],
  testPathIgnorePatterns: ["node_modules", ".devcontainer", "dist"],
  watchPathIgnorePatterns: ["node_modules", ".devcontainer", "dist"],
  moduleNameMapper: {
    axios: "axios/dist/node/axios.cjs", // here as IGood am currently doing feature tests with jest
  },
}
