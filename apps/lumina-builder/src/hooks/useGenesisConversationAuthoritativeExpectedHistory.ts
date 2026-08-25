import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createGenesisConversationAuthoritativeExpectedHistory,
  getGenesisConversationCompletenessCertificationForExpectedHistory,
  getGenesisConversationExpectedHistory,
} from "@/services/runtime/genesisConversationAuthoritativeExpectedHistory";

import type {
  GenesisConversationExpectedHistoryProjection,
} from "@/services/runtime/genesisConversationAuthoritativeExpectedHistory";

import type {
  GenesisConversationAuthoritativeCompletenessCertificationProjection,
} from "@/services/runtime/genesisConversationAuthoritativeCompletenessCertification";


export interface GenesisConversationAuthoritativeExpectedHistoryHookState {
  expectedHistory:
    GenesisConversationExpectedHistoryProjection |
    null;

  certification:
    GenesisConversationAuthoritativeCompletenessCertificationProjection |
    null;

  loading:
    boolean;

  submitting:
    boolean;

  error:
    string | null;

  refresh():
    Promise<void>;

  create():
    Promise<boolean>;

  clearError():
    void;
}


export function useGenesisConversationAuthoritativeExpectedHistory():
  GenesisConversationAuthoritativeExpectedHistoryHookState {
  const [
    expectedHistory,
    setExpectedHistory,
  ] =
    useState<
      GenesisConversationExpectedHistoryProjection |
      null
    >(
      null,
    );

  const [
    certification,
    setCertification,
  ] =
    useState<
      GenesisConversationAuthoritativeCompletenessCertificationProjection |
      null
    >(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  const refresh =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const [
            expectedProjection,
            certificationProjection,
          ] =
            await Promise.all([
              getGenesisConversationExpectedHistory(),
              getGenesisConversationCompletenessCertificationForExpectedHistory(),
            ]);

          setExpectedHistory(
            expectedProjection,
          );

          setCertification(
            certificationProjection,
          );
        } catch (
          caught
        ) {
          setError(
            caught instanceof
              Error
              ? caught.message
              : "genesis_conversation_authoritative_expected_history_read_failed",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  const create =
    useCallback(
      async (): Promise<boolean> => {
        setSubmitting(
          true,
        );

        setError(
          null,
        );

        try {
          const projection =
            await createGenesisConversationAuthoritativeExpectedHistory();

          setExpectedHistory(
            projection,
          );

          setCertification(
            await getGenesisConversationCompletenessCertificationForExpectedHistory(),
          );

          return true;
        } catch (
          caught
        ) {
          setError(
            caught instanceof
              Error
              ? caught.message
              : "genesis_conversation_authoritative_expected_history_create_failed",
          );

          return false;
        } finally {
          setSubmitting(
            false,
          );
        }
      },
      [],
    );


  const clearError =
    useCallback(
      () => {
        setError(
          null,
        );
      },
      [],
    );


  useEffect(
    () => {
      void refresh();
    },
    [
      refresh,
    ],
  );


  return {
    expectedHistory,
    certification,
    loading,
    submitting,
    error,
    refresh,
    create,
    clearError,
  };
}
