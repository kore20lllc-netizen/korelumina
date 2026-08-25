import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  certifyGenesisConversationAuthoritativeCompleteness,
  getGenesisConversationAuthoritativeCompletenessCertification,
} from "@/services/runtime/genesisConversationAuthoritativeCompletenessCertification";

import type {
  GenesisConversationAuthoritativeCompletenessCertificationProjection,
} from "@/services/runtime/genesisConversationAuthoritativeCompletenessCertification";


export interface GenesisConversationAuthoritativeCompletenessCertificationHookState {
  projection:
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

  certify(
    input: {
      certifiedBy:
        string;

      reason:
        string;
    },
  ):
    Promise<boolean>;

  clearError():
    void;
}


export function useGenesisConversationAuthoritativeCompletenessCertification():
  GenesisConversationAuthoritativeCompletenessCertificationHookState {
  const [
    projection,
    setProjection,
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
          setProjection(
            await getGenesisConversationAuthoritativeCompletenessCertification(),
          );
        } catch (
          caught
        ) {
          setError(
            caught instanceof
              Error
              ? caught.message
              : "genesis_conversation_authoritative_completeness_certification_read_failed",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  const certify =
    useCallback(
      async (
        input: {
          certifiedBy:
            string;

          reason:
            string;
        },
      ): Promise<boolean> => {
        setSubmitting(
          true,
        );

        setError(
          null,
        );

        try {
          const next =
            await certifyGenesisConversationAuthoritativeCompleteness({
              certifiedBy:
                input.certifiedBy,

              certifiedAt:
                Date.now(),

              reason:
                input.reason,
            });

          setProjection(
            next,
          );

          return true;
        } catch (
          caught
        ) {
          setError(
            caught instanceof
              Error
              ? caught.message
              : "genesis_conversation_authoritative_completeness_certification_write_failed",
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
    projection,
    loading,
    submitting,
    error,
    refresh,
    certify,
    clearError,
  };
}
