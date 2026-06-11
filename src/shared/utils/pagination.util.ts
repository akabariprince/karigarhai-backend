export const getPaginationParams = (
  page: string | undefined,
  limit: string | undefined
): { page: number; limit: number } => {
  const p = Math.max(1, parseInt(page || '1'));
  const l = Math.min(100, Math.max(1, parseInt(limit || '20')));
  return { page: p, limit: l };
};

export const getSkipTake = (
  page: number,
  limit: number
): { skip: number; take: number } => {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};
