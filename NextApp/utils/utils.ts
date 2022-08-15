export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isNotDefined = <T>(value: T | null | undefined): value is null | undefined => {
  return !isDefined(value);
};

export const sleep = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
