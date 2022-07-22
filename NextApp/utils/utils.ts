export const sleep = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
