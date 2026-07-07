export const getSortDirection = (isAsc: boolean): 'asc' | 'desc' => isAsc ? 'asc' : 'desc';

export const toggleSortOrder = (order: 'asc' | 'desc'): 'asc' | 'desc' => order === 'asc' ? 'desc' : 'asc';
