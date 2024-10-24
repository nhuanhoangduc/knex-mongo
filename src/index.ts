/**
 * TypeScript actually sucks, don't use it
 * TypeScript actually sucks, don't use it
 * TypeScript actually sucks, don't use it
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Knex } from "knex";
const BaseClient = require("knex/lib/dialects/mysql/index.js");
import { MongoClient, MongoClientOptions } from "mongodb";
import SQLParser from "@synatic/noql";
const {
  formatQuery,
} = require("knex/lib/execution/internal/query-executioner");

export type KnexTrinoConfig = Knex.Config & {
  mongo: {
    url: string;
    databaseName: string;
    options?: MongoClientOptions;
  };
};

class ClientAtlasSqlOdbcImpl extends BaseClient {
  private mongoClient;

  constructor(config: KnexTrinoConfig) {
    super({
      ...config,
      // Enforce a single connection:
      pool: { min: 1, max: 1 },
      connection: {},
    } satisfies Knex.Config);
  }

  _driver() {
    this.mongoClient = new MongoClient(
      this.config.mongo.url,
      this.config.mongo.options
    );
  }

  // Acquire a connection from the pool.
  async acquireConnection() {
    await this.mongoClient.connect();
    const db = this.mongoClient.db(this.config.mongo.databaseName);
    return db;
  }

  async destroyRawConnection() {}

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection() {}

  // Destroy the current connection pool for the client.
  async destroy(callback) {
    callback();
  }

  async _query(db: any, obj: any) {
    if (!obj.sql) throw new Error("The query is empty");

    // fill params to query
    const query = formatQuery(obj.sql, obj.bindings, "UTC", this).replaceAll(
      "`",
      ""
    );

    // parse sql query
    const parsedSQL = SQLParser.parseSQL(query);

    // execute
    if (parsedSQL.type === "query") {
      const mongoQuery = db
        .collection(parsedSQL.collection)
        .find(parsedSQL.query || {}, {
          projection: parsedSQL.projection || {},
        });

      // add limit
      if (typeof parsedSQL.limit === "number") {
        mongoQuery.limit(parsedSQL.limit);
      }
      // add skip
      if (typeof parsedSQL.skip === "number") {
        mongoQuery.skip(parsedSQL.skip);
      }
      // add sort
      if (parsedSQL.sort) {
        mongoQuery.sort(parsedSQL.sort);
      }

      obj.response = await mongoQuery.toArray();
    } else if (parsedSQL.type === "aggregate") {
      obj.response = await db
        .collection(parsedSQL.collections[0])
        .aggregate(parsedSQL.pipeline)
        .toArray();
    }

    return obj;
  }

  // Process the response as returned from the query.
  processResponse(obj) {
    if (obj == null) return;
    const { response } = obj;
    const { method } = obj;
    switch (method) {
      case "select":
        return response;
      case "first":
        return response[0];
      case "del":
      case "update":
      case "counter":
        return response;
      default:
        return response;
    }
  }
}

const ClientAtlasSqlOdbc =
  ClientAtlasSqlOdbcImpl as unknown as typeof Knex.Client;
export default ClientAtlasSqlOdbc;
