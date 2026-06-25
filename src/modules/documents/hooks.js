import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/v1/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.data; // Array of documents
    },
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title) => {
      const res = await fetch("/api/v1/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDocument = (id) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/documents/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useUpdateDocument = (id) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title) => {
      const res = await fetch(`/api/v1/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (updatedDoc) => {
      queryClient.setQueryData(["document", id], updatedDoc);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};
