import Knex from "knex";
import ClientAtlasSqlOdbc from "../src/index";
import { describe, it, expect, beforeAll } from "vitest";

describe("Basic tests", () => {
  let db: Knex.Knex;

  beforeAll(() => {
    db = Knex({
      client: ClientAtlasSqlOdbc,
      mongo: {
        url: "mongodb://mongodb0:27021,mongodb1:27022,mongodb2:27023/dev?replicaSet=rs0",
        databaseName: "dev",
      },
    });
  });

  it("should run sql operations in the engine", async () => {
    const result = await db.raw(
      `select "_id", "full_name" from "users" where "id" = 3006`
    );
    expect(result).toBeTruthy();
    expect(result).toHaveLength(1);
  });

  it("should be able to use query builder", async () => {
    const results = await db("users")
      .select("id", "full_name")
      .where({ id: 3006 });
    expect(results).toBeTruthy();
    expect(results[0].id).toBe(3006);
  });

  it("should be able to join tables", async () => {
    const results = await db("artworks as a")
      .leftJoin("artwork_users as au", (join) =>
        join.on("au.artwork_id", "a.id").andOnVal("au.type", "creator")
      )
      .where({
        "a.is_sold": true,
        "au.is_hidden_on_profile": false,
      })
      .whereIn("a.artwork_creator_id", [1])
      .whereNotIn("a.id", [2])
      .groupBy("a.artwork_creator_id")
      .select("a.artwork_creator_id as userId")
      .count("* as count");
    expect(results).toHaveLength(0);
  });

  it("Should able to count", async () => {
    const result = await db("testimonials as t").count("* as count").first();
    expect(result.count).greaterThan(0);
  });

  it("Should select first item", async () => {
    const user = await db("users")
      .select("id", "full_name")
      .where({ full_name: "Khan" })
      .first();
    expect(user).toMatchObject({ full_name: "Khan" });
  });

  it("Should filter by boolean", async () => {
    const user = await db("users")
      .select("id", "full_name")
      .where({ full_name: "Khan", is_deleted: false })
      .first();
    expect(user).toMatchObject({ full_name: "Khan" });
  });

  it("Should select first n items", async () => {
    const users = await db("users").select("id", "full_name").limit(6);
    expect(users).toHaveLength(6);
  });

  it("Should order, offset, limit items", async () => {
    const users = await db("users")
      .select("id", "full_name")
      .orderBy([{ column: "id", order: "desc" }])
      .offset(3)
      .limit(6);
    expect(users).toHaveLength(6);
  });

  it("Should offset items", async () => {
    const users = await db("users")
      .select("id", "full_name")
      .orderBy([{ column: "id", order: "desc" }])
      .limit(3)
      .offset(3);
    expect(users.length).greaterThan(0);
  });
});
