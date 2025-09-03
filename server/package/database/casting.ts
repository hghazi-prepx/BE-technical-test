export const castRelations = <T>(rel: number[] | number) => {
  if (typeof rel === 'number') {
    return [{ id: rel }] as unknown as T[];
  }
  return rel.map((item) => {
    return { id: item };
  }) as unknown as T[];
};
