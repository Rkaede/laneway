export const noop = () => {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pick = <Obj extends { [key: string]: any }, Key extends keyof Obj>(
  props: Key[],
  obj: Obj,
): Pick<Obj, Key> =>
  props.reduce(
    (acc, prop) => {
      acc[prop] = obj[prop];
      return acc;
    },
    {} as Pick<Obj, Key>,
  );
