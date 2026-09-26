"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contract, Prospect, ProspectComment } from "@/types/db";

export type ProspectWithComments = Prospect & { prospect_comments: ProspectComment[] };

type DataContextValue = {
  contracts: Contract[];
  prospects: ProspectWithComments[];
  loading: boolean;
  refetch: () => Promise<void>;
  createContract: (
    input: Partial<Contract> & Pick<Contract, "brand" | "end_date">,
  ) => Promise<Contract>;
  updateContract: (id: string, input: Partial<Contract>) => Promise<Contract>;
  deleteContract: (id: string) => Promise<void>;
  createContractsBatch: (
    inputs: (Partial<Contract> & Pick<Contract, "brand" | "end_date">)[],
  ) => Promise<Contract[]>;
  createProspect: (
    input: Partial<Prospect> & Pick<Prospect, "name">,
    firstComment?: string,
  ) => Promise<ProspectWithComments>;
  updateProspect: (id: string, input: Partial<Prospect>) => Promise<Prospect>;
  deleteProspect: (id: string) => Promise<void>;
  addComment: (prospectId: string, body: string) => Promise<ProspectComment>;
  /** Batch-inserts prospects, then a first comment per prospect where `comments[i]` is non-null. */
  createProspectsBatch: (
    inputs: (Partial<Prospect> & Pick<Prospect, "name">)[],
    comments: (string | null)[],
  ) => Promise<Prospect[]>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [prospects, setProspects] = useState<ProspectWithComments[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = useCallback(async () => {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("end_date", { ascending: true });
    if (error) throw error;
    setContracts(data ?? []);
  }, []);

  const fetchProspects = useCallback(async () => {
    const { data, error } = await supabase
      .from("prospects")
      .select("*, prospect_comments(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setProspects((data as ProspectWithComments[]) ?? []);
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchContracts(), fetchProspects()]);
  }, [fetchContracts, fetchProspects]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load; setLoading(false) reports fetch completion, not a derived-state sync.
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  const createContract = useCallback<DataContextValue["createContract"]>(
    async (input) => {
      const { data, error } = await supabase.from("contracts").insert(input).select().single();
      if (error) throw error;
      await fetchContracts();
      return data;
    },
    [fetchContracts],
  );

  const updateContract = useCallback<DataContextValue["updateContract"]>(
    async (id, input) => {
      const { data, error } = await supabase
        .from("contracts")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await fetchContracts();
      return data;
    },
    [fetchContracts],
  );

  const deleteContract = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
      await fetchContracts();
    },
    [fetchContracts],
  );

  const createContractsBatch = useCallback<DataContextValue["createContractsBatch"]>(
    async (inputs) => {
      if (inputs.length === 0) return [];
      const { data, error } = await supabase.from("contracts").insert(inputs).select();
      if (error) throw error;
      await fetchContracts();
      return data ?? [];
    },
    [fetchContracts],
  );

  const createProspect = useCallback<DataContextValue["createProspect"]>(
    async (input, firstComment) => {
      const { data, error } = await supabase.from("prospects").insert(input).select().single();
      if (error) throw error;
      if (firstComment && firstComment.trim()) {
        const { error: commentError } = await supabase
          .from("prospect_comments")
          .insert({ prospect_id: data.id, body: firstComment.trim() });
        if (commentError) throw commentError;
      }
      await fetchProspects();
      const fresh = await supabase
        .from("prospects")
        .select("*, prospect_comments(*)")
        .eq("id", data.id)
        .single();
      return (fresh.data as ProspectWithComments) ?? { ...data, prospect_comments: [] };
    },
    [fetchProspects],
  );

  const updateProspect = useCallback<DataContextValue["updateProspect"]>(
    async (id, input) => {
      const { data, error } = await supabase
        .from("prospects")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await fetchProspects();
      return data;
    },
    [fetchProspects],
  );

  const deleteProspect = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("prospects").delete().eq("id", id);
      if (error) throw error;
      await fetchProspects();
    },
    [fetchProspects],
  );

  const createProspectsBatch = useCallback<DataContextValue["createProspectsBatch"]>(
    async (inputs, comments) => {
      if (inputs.length === 0) return [];
      const { data, error } = await supabase.from("prospects").insert(inputs).select();
      if (error) throw error;
      const commentRows = data
        .map((p, i) => (comments[i] ? { prospect_id: p.id, body: comments[i] as string } : null))
        .filter((c): c is { prospect_id: string; body: string } => c !== null);
      if (commentRows.length > 0) {
        const { error: commentError } = await supabase.from("prospect_comments").insert(commentRows);
        if (commentError) throw commentError;
      }
      await fetchProspects();
      return data;
    },
    [fetchProspects],
  );

  const addComment = useCallback(
    async (prospectId: string, body: string) => {
      const { data, error } = await supabase
        .from("prospect_comments")
        .insert({ prospect_id: prospectId, body })
        .select()
        .single();
      if (error) throw error;
      await fetchProspects();
      return data;
    },
    [fetchProspects],
  );

  return (
    <DataContext.Provider
      value={{
        contracts,
        prospects,
        loading,
        refetch,
        createContract,
        updateContract,
        deleteContract,
        createContractsBatch,
        createProspect,
        updateProspect,
        deleteProspect,
        addComment,
        createProspectsBatch,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
