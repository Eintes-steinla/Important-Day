/**
 * Khóa TanStack Query dùng chung cho web và mobile, để invalidate nhất quán
 * (vd sau khi tạo sự kiện: queryClient.invalidateQueries({ queryKey: queryKeys.events.all })).
 */
export const queryKeys = {
  events: {
    all: ["events"] as const,
    list: () => ["events", "list"] as const,
    detail: (id: string) => ["events", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },
  profile: {
    all: ["profile"] as const,
    detail: (userId: string) => ["profile", userId] as const,
  },
} as const;
