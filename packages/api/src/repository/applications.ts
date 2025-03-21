import {
  applications as tApplications,
  interviews as tInterviews,
} from "@job-seekr/data/tables";
import { type DBType, and, count, eq } from "@job-seekr/data/utils";
import type {
  ApplicationListModel,
  ApplicationModel,
  InterviewModel,
  NewApplicationModel,
} from "@job-seekr/data/validation";
import { Err, Ok, type Result } from "neverthrow";

export class ApplicationsRepository {
  constructor(private db: DBType) {}
  async getAllApplications(
    userId: string,
  ): Promise<Result<ApplicationListModel[], string>> {
    try {
      const applications = await this.db
        .select({
          id: tApplications.id,
          company: tApplications.company,
          position: tApplications.position,
          application_date: tApplications.application_date,
          status: tApplications.status,
          job_description: tApplications.job_description,
          job_posting_url: tApplications.job_posting_url,
          interviewsCount: count(tInterviews.id),
          user_id: tApplications.user_id,
        })
        .from(tApplications)
        .where(eq(tApplications.user_id, userId))
        .leftJoin(tInterviews, eq(tApplications.id, tInterviews.application_id))
        .groupBy(tApplications.id, tInterviews.application_id);
      return new Ok(applications);
    } catch (e) {
      if (e instanceof Error) {
        return new Err(
          `Failed to read from the applications table: ${e.message}`,
        );
      }
      return new Err(
        "Failed to read from the applications table: unknown error",
      );
    }
  }

  async getApplicationById(
    userId: string,
    id: string,
  ): Promise<
    Result<
      {
        application: ApplicationModel;
        interviews: InterviewModel[];
      },
      string
    >
  > {
    try {
      const applications = await this.db
        .select()
        .from(tApplications)
        .where(
          and(eq(tApplications.user_id, userId), eq(tApplications.id, id)),
        );

      if (applications.length === 0) {
        return new Err("Not found");
      }
      const interviews = await this.db
        .select()
        .from(tInterviews)
        .where(eq(tInterviews.application_id, id))
        .orderBy(tInterviews.interview_date);

      return new Ok({
        application: applications[0],
        interviews,
      });
    } catch (e) {
      if (e instanceof Error) {
        return new Err(
          `Failed to read from the applications table: ${e.message}`,
        );
      }
      return new Err(
        "Failed to read from the applications table: unknown error",
      );
    }
  }

  async setApplicationStatus(
    userId: string,
    id: string,
    newStatus: string,
  ): Promise<Result<ApplicationModel, string>> {
    try {
      const res = await this.db
        .update(tApplications)
        .set({ status: newStatus })
        .where(and(eq(tApplications.id, id), eq(tApplications.user_id, userId)))
        .returning();

      return new Ok(res[0]);
    } catch (e) {
      if (e instanceof Error) {
        return new Err(`Failed to update the application: ${e.message}`);
      }
      return new Err("Failed to update the application: unknown error");
    }
  }

  async setApplicationJobDescription(
    userId: string,
    id: string,
    newJD: string,
  ): Promise<Result<ApplicationModel, string>> {
    try {
      const res = await this.db
        .update(tApplications)
        .set({ job_description: newJD })
        .where(and(eq(tApplications.id, id), eq(tApplications.user_id, userId)))
        .returning();

      return new Ok(res[0]);
    } catch (e) {
      if (e instanceof Error) {
        return new Err(`Failed to update the application: ${e.message}`);
      }
      return new Err("Failed to update the application: unknown error");
    }
  }

  async addApplication(
    payload: ApplicationModel,
  ): Promise<Result<ApplicationModel, string>> {
    try {
      const record = await this.db
        .insert(tApplications)
        .values(payload)
        .onConflictDoNothing()
        .returning();
      return new Ok(record[0]);
    } catch (e) {
      if (e instanceof Error) {
        return new Err(
          `Failed to insert into the applications table: ${e.message}`,
        );
      }
      return new Err(
        "Failed to insert into the applications table: unknown error",
      );
    }
  }

  async deleteApplications(
    params:
      | { _tag: "of-user"; id: string }
      | { _tag: "applications"; ids: string[] },
  ): Promise<Result<boolean, string>> {
    try {
      switch (params._tag) {
        case "of-user": {
          await this.db
            .delete(tApplications)
            .where(eq(tApplications.user_id, params.id))
            .execute();
          return new Ok(true);
        }
        case "applications": {
          await this.db
            .delete(tApplications)
            .where(and(...params.ids.map((id) => eq(tApplications.id, id))))
            .execute();
          return new Ok(true);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        return new Err(`Failed to delete user applications: ${e.message}`);
      }
      return new Err("Failed to delete user applications: unknown error");
    }
  }
}
