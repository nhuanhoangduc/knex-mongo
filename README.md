# @hoangducnhuan/knex-mongo

Mongo Dialect for [knex.js](http://knexjs.org)

## Install

```bash

npm install @hoangducnhuan/knex-mongo

```

## Usage

```ts
import { knex } from "knex";
import ClientMongo from "@hoangducnhuan/knex-mongo";

const instance = knex({
  client: ClientMongo,
  mongo: {
    url: "mongodb://host1:27017,host2:27017,host3:27017/?replicaSet=myRs",
    databaseName: "dev",
    options: {},
  },
});
```

## License

[MIT License](LICENSE)
