import 'reflect-metadata';
import { MysqlDataSource } from './config/database';
import { Pokemon } from './endpoints/pokemon/Pokemon.entity';

async function seed() {
  console.log('Iniciando conexão com o banco de dados...');
  await MysqlDataSource.initialize();
  console.log('Banco de dados conectado!');

  const repository = MysqlDataSource.getRepository(Pokemon);

  console.log('Limpando a tabela atual de Pokémons...');
  await repository.clear();

  const totalToInsert = 100000; // 100 mil registros
  const batchSize = 5000; // Inserir de 5000 em 5000 para não estourar a memória

  console.log(
    `Iniciando a inserção de ${totalToInsert} Pokémons em lotes de ${batchSize}...`
  );

  const types = [
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Psychic',
    'Normal',
    'Flying',
    'Bug',
    'Poison',
    'Ground'
  ];

  for (let i = 0; i < totalToInsert; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize; j++) {
      const id = i + j + 1;
      const randomType = types[Math.floor(Math.random() * types.length)];
      batch.push({
        name: `Pokemon_${id}`,
        type: randomType
      });
    }

    await repository.insert(batch);
    console.log(`Progresso: ${i + batchSize} / ${totalToInsert} inseridos...`);
  }

  console.log('Seed concluído com sucesso!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Erro ao executar o seed:', error);
  process.exit(1);
});
