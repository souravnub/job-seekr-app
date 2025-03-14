import { zValidator } from "@hono/zod-validator";
import { newApplicationSchema } from "@job-seekr/data/validation";
import { Hono } from "hono";
import { z } from "zod";
import type { WithAuthMiddleware } from "../auth.middleware";
import {
  type ApplicationsController,
  applicationUpdateCommandSchema,
} from "../controllers/applications";

export function makeApplicationsRouter(
  authMiddleware: WithAuthMiddleware,
  applicationsController: ApplicationsController,
) {
  return new Hono()
    .get("/", authMiddleware.middleware, async (c) => {
      const res = await applicationsController.getAllApplications(
        c.var.user.id,
      );
      if (res.isErr()) {
        return c.json({ error: res.error }, 500);
      }
      return c.json({ data: res.value });
    })
    .post(
      "/",
      authMiddleware.middleware,
      zValidator("json", newApplicationSchema),
      async (c) => {
        const result = await applicationsController.addNewApplication(
          c.var.user.id,
          c.req.valid("json"),
        );
        if (result.isErr()) {
          return c.json({ error: result.error }, 500);
        }
        return c.json({ data: result.value });
      },
    )
    .get(
      "/:id",
      authMiddleware.middleware,
      zValidator("param", z.object({ id: z.string().uuid() })),
      async (c) => {
        const entry = await applicationsController.getApplicationById(
          c.var.user.id,
          c.req.param("id"),
        );
        if (!entry) {
          return c.json({ error: "not found" }, 404);
        }
        return c.json({ data: entry });
      },
    )
    .put(
      "/:id",
      authMiddleware.middleware,
      zValidator("param", z.object({ id: z.string().uuid() })),
      zValidator("json", applicationUpdateCommandSchema),
      async (c) => {
        const result = await applicationsController.updateApplication(
          c.var.user.id,
          c.req.valid("param").id,
          c.req.valid("json"),
        );
        if (result.isErr()) {
          return c.json({ error: result.error }, 500);
        }
        return c.json({ data: result.value });
      },
    )
    .delete("/of-user", authMiddleware.middleware, async (c) => {
      const result = await applicationsController.deleteUserApplications(
        c.var.user.id,
      );
      if (result.isErr()) {
        return c.json({ error: result.error }, 500);
      }
      return c.text("done");
    })
    .delete(
      "/:id",
      authMiddleware.middleware,
      zValidator("param", z.object({ id: z.string().uuid() })),
      async (c) => {
        const result = await applicationsController.deleteApplicarionById(
          c.req.valid("param").id,
        );
        if (result.isErr()) {
          return c.json({ error: result.error }, 500);
        }
        return c.text("done");
      },
    );
}
