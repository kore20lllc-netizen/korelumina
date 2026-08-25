import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  decideGenesisConversationHistoryCandidateReview,
  getGenesisConversationHistoryCandidateReview,
} from "@/services/runtime/genesisConversationExpectedHistoryCandidateReview";

import type {
  GenesisConversationHistoryCandidateReview,
  GenesisConversationHistoryCandidateReviewDecisionInput,
} from "@/services/runtime/genesisConversationExpectedHistoryCandidateReview";


export interface GenesisConversationHistoryCandidateReviewHookState {
  review:
    GenesisConversationHistoryCandidateReview |
    null;

  loading:
    boolean;

  submitting:
    boolean;

  error:
    string | null;

  refresh():
    Promise<void>;

  decide(
    input:
      GenesisConversationHistoryCandidateReviewDecisionInput,
  ):
    Promise<boolean>;

  clearError():
    void;
}


export function useGenesisConversationHistoryCandidateReview():
  GenesisConversationHistoryCandidateReviewHookState {
  const [
    review,
    setReview,
  ] =
    useState<
      GenesisConversationHistoryCandidateReview |
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
          const current =
            await getGenesisConversationHistoryCandidateReview();

          setReview(
            current,
          );
        } catch (
          caught
        ) {
          setError(
            caught instanceof
              Error
              ? caught.message
              : "genesis_conversation_history_candidate_review_read_failed",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  const decide =
    useCallback(
      async (
        input:
          GenesisConversationHistoryCandidateReviewDecisionInput,
      ): Promise<boolean> => {
        setSubmitting(
          true,
        );

        setError(
          null,
        );

        try {
          const next =
            await decideGenesisConversationHistoryCandidateReview(
              input,
            );

          setReview(
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
              : "genesis_conversation_history_candidate_review_write_failed",
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
    review,
    loading,
    submitting,
    error,
    refresh,
    decide,
    clearError,
  };
}
