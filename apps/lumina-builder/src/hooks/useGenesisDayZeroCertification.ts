import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  certifyGenesisDayZero,
  getGenesisDayZeroCertification,
} from "@/services/runtime/genesisDayZeroCertification";

import type {
  GenesisDayZeroCertificationRuntimeProjection,
} from "@/services/runtime/genesisDayZeroCertification";


export interface GenesisDayZeroCertificationHookState {
  projection:
    GenesisDayZeroCertificationRuntimeProjection |
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

      acknowledgedHistoricallyUnavailableConversationIds:
        readonly string[];
    },
  ):
    Promise<boolean>;

  clearError():
    void;
}


export function useGenesisDayZeroCertification():
  GenesisDayZeroCertificationHookState {
  const [
    projection,
    setProjection,
  ] =
    useState<
      GenesisDayZeroCertificationRuntimeProjection |
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
            await getGenesisDayZeroCertification();

          setProjection(
            current,
          );
        } catch (
          caught
        ) {
          setError(
            caught instanceof
              Error
              ? caught.message
              : "genesis_day_zero_certification_read_failed",
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

          acknowledgedHistoricallyUnavailableConversationIds:
            readonly string[];
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
            await certifyGenesisDayZero({
              certifiedBy:
                input.certifiedBy,

              certifiedAt:
                Date.now(),

              reason:
                input.reason,

              acknowledgedHistoricallyUnavailableConversationIds:
                input
                  .acknowledgedHistoricallyUnavailableConversationIds,
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
              : "genesis_day_zero_certification_write_failed",
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
