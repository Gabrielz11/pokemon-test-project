import { DataSource } from 'typeorm';
import { Pokemon } from '../endpoints/pokemon/Pokemon.entity';

export const MysqlDataSource = new DataSource({
  name: 'default',
  type: 'mysql',
  database: process.env.DB_DATABASE || 'node_api',
  url:
    process.env.DB_CONNECTION_STRING ||
    'mysql://nodeapi_root:j5m966qp7jiypfda@127.0.0.1:3308/node_api',
  entities: [Pokemon],
  logging: false,
  synchronize: true
});
