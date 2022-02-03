type Obj<T> = { [key: string]: T };

const mapObject = <T, U>(
  item: Obj<T>,
  cb: (key: string, value: T) => U
): U[] => {
  const result: U[] = [];

  Object.keys(item).forEach((key) => {
    result.push(cb(key, item[key]));
  });
  return result;
};

const makeObject = <T>(pairs: Array<[string, T]>): Obj<T> => {
  const result: Obj<T> = {};

  pairs.forEach(([key, value]) => {
    result[key] = value;
  });
  return result;
};

const getValueByKey = (key: string, item: Obj<unknown>): unknown => item[key];

const isObject = (item: unknown): boolean => {
  return typeof item === "object" && item !== null;
};

const deepClone = (itm: unknown): unknown => {
  if (typeof itm === "undefined") return undefined;

  if (itm === null) return null;

  if (Array.isArray(itm)) return itm.map(deepClone);

  if (typeof itm === "object")
    return makeObject(
      mapObject(
        itm as Obj<unknown>,
        (key: string, value: unknown): [string, unknown] => [
          key,
          deepClone(value),
        ]
      )
    );
  return itm;
};

const deepGet = (item: unknown, paths: string[]): unknown =>
  paths.reduce((acc, path) => {
    if (isObject(acc)) return getValueByKey(path, acc as Obj<unknown>);
    return undefined;
  }, item);

export { deepClone, deepGet, makeObject, mapObject };
