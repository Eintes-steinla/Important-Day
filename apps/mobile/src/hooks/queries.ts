import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createEvent,
  deleteCategory,
  deleteEvent,
  getProfile,
  listCategories,
  listEvents,
  queryKeys,
  updateCategory,
  updateCategoryAppearance,
  updateEvent,
  updateProfile,
  type CategoryAppearanceFormInput,
  type CategoryFormInput,
  type EventFormInput,
  type ProfileUpdateInput,
} from "@important-dates/core";
import { useSupabase } from "../providers/SupabaseProvider";

// Cùng cấu trúc với apps/web/src/hooks/queries.ts và dùng chung queryKeys của packages/core.

export function useEventsQuery() {
  const client = useSupabase();
  return useQuery({ queryKey: queryKeys.events.list(), queryFn: () => listEvents(client) });
}

export function useCategoriesQuery() {
  const client = useSupabase();
  return useQuery({ queryKey: queryKeys.categories.list(), queryFn: () => listCategories(client) });
}

export function useProfileQuery(userId: string) {
  const client = useSupabase();
  return useQuery({
    queryKey: queryKeys.profile.detail(userId),
    queryFn: () => getProfile(client, userId),
  });
}

export function useSaveEvent() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: EventFormInput }) =>
      id ? updateEvent(client, id, input) : createEvent(client, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  });
}

export function useDeleteEvent() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(client, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  });
}

export type SaveCategoryVariables =
  | { id: null; input: CategoryFormInput }
  | { id: string; input: CategoryFormInput; appearanceOnly: false }
  | { id: string; input: CategoryAppearanceFormInput; appearanceOnly: true };

export function useSaveCategory() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: SaveCategoryVariables) => {
      if (variables.id === null) return createCategory(client, variables.input);
      if (variables.appearanceOnly) {
        return updateCategoryAppearance(client, variables.id, variables.input);
      }
      return updateCategory(client, variables.id, variables.input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}

export function useDeleteCategory() {
  const client = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(client, id),
    onSuccess: () =>
      // Xóa danh mục làm category_id của sự kiện về null nên phải tải lại cả hai
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
      ]),
  });
}

export function useUpdateProfile(userId: string) {
  const client = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdateInput) => updateProfile(client, userId, patch),
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile.detail(userId), profile),
  });
}
