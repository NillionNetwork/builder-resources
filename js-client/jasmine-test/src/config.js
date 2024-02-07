export const loadFixtureConfig = async () => {
  //const response = await fetch("/__spec__/src/fixture/remote.json");
  const response = await fetch("/__spec__/src/fixture/local.json");
  const config = await response.json();
  return config;
};
