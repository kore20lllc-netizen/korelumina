import { Router } from "express";

import {
  knowledgeOperationsService,
} from "../../knowledge-operations/index.js";

import {
  listCapabilityProviders,
} from "../../knowledge/capability/index.js";

const router = Router();

router.get(
  "/overview",
  (_req, res) => {
    res.json(
      knowledgeOperationsService.getSnapshot(),
    );
  },
);



router.get(
  "/capabilities",
  (_req, res) => {
    res.json({
      ok: true,
      providers: listCapabilityProviders().map(
        (provider) => ({
          id: provider.id,
        }),
      ),
    });
  },
);

router.get(
  "/providers",
  (_req, res) => {
    res.json(
      knowledgeOperationsService.listProviders(),
    );
  },
);

router.get(
  "/repositories/:repositoryId/status",
  (req, res) => {
    const status =
      knowledgeOperationsService.getRepositoryStatus(
        req.params.repositoryId,
      );

    if (!status) {
      return res.status(404).json({
        ok: false,
        error: "repository_not_found",
      });
    }

    return res.json({
      ok: true,
      status,
    });
  },
);

router.get(
  "/repositories/:repositoryId/metrics",
  (req, res) => {
    res.json({
      ok: true,
      metrics:
        knowledgeOperationsService.getRepositoryMetrics(
          req.params.repositoryId,
        ),
    });
  },
);

router.post(
  "/repositories/:repositoryId/acquire",
  async (req, res, next) => {
    try {
      const repositoryRoot =
        req.body?.repositoryRoot;

      if (
        typeof repositoryRoot !== "string" ||
        repositoryRoot.length === 0
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "repository_root_required",
        });
      }

      const result =
        await knowledgeOperationsService.acquireRepository(
          req.params.repositoryId,
          repositoryRoot,
        );

      res.json({
        ok: true,
        result,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
