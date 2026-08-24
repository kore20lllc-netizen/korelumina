import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  certifyEducationalCorpus,
  getEducationalCorpus,
  getEducationalCorpusCertification,
  persistEducationalCorpus,
} from "@/services/educationalCorpusService";

import type {
  EducationalCorpusCertificationProjection,
  EducationalCorpusRuntimeProjection,
} from "@/services/educationalCorpusService";


export function useEducationalCorpusCertification() {
  const [
    corpus,
    setCorpus,
  ] =
    useState<
      EducationalCorpusRuntimeProjection |
      null
    >(
      null,
    );

  const [
    certification,
    setCertification,
  ] =
    useState<
      EducationalCorpusCertificationProjection |
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
    busy,
    setBusy,
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
            nextCorpus,
            nextCertification,
          ] =
            await Promise.all([
              getEducationalCorpus(),
              getEducationalCorpusCertification(),
            ]);

          setCorpus(
            nextCorpus,
          );

          setCertification(
            nextCertification,
          );
        } catch (
          caught
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "educational_corpus_refresh_failed",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  const persist =
    useCallback(
      async (): Promise<boolean> => {
        setBusy(
          true,
        );

        setError(
          null,
        );

        try {
          const nextCorpus =
            await persistEducationalCorpus();

          setCorpus(
            nextCorpus,
          );

          setCertification(
            await getEducationalCorpusCertification(),
          );

          return true;
        } catch (
          caught
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "educational_corpus_persist_failed",
          );

          return false;
        } finally {
          setBusy(
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

          acknowledgedExcludedArtifactIds:
            readonly string[];
        },
      ): Promise<boolean> => {
        setBusy(
          true,
        );

        setError(
          null,
        );

        try {
          const next =
            await certifyEducationalCorpus(
              input,
            );

          setCertification(
            next,
          );

          setCorpus(
            await getEducationalCorpus(),
          );

          return true;
        } catch (
          caught
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "educational_corpus_certification_write_failed",
          );

          return false;
        } finally {
          setBusy(
            false,
          );
        }
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
    corpus,
    certification,
    loading,
    busy,
    error,
    refresh,
    persist,
    certify,
    clearError:
      () =>
        setError(
          null,
        ),
  };
}
