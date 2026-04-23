import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

const port = Number(process.env.DB_PORT ?? '5432');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.isNaN(port) ? 5432 : port,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'finsight_db',
  entities: [join(__dirname, '../modules/**/entities/*.entity.{js,ts}')],
  migrations: [join(__dirname, './migrations/*.{js,ts}')],
  synchronize: false,
});
