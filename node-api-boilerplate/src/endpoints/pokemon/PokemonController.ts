import { Request, Response } from 'express';
import { PokemonRepository } from './Pokemon.repository';
import { Pokemon } from './Pokemon.entity';

// Memória de Cache (Persiste entre as requisições)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memoryCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_DURATION_MS = 10 * 1000; // Cache de 10 segundos

export class PokemonController {
  /**
   * @swagger
   * /pokemon:
   *   post:
   *     summary: Cria um novo Pokémon
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     requestBody:
   *         description: Dados necessários para criar um Pokémon
   *         required: true
   *         content:
   *           application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  name:
   *                    type: string
   *                    description: Nome do Pokémon
   *                    example: Pikachu
   *                  type:
   *                    type: string
   *                    description: Tipo do Pokémon
   *                    example: Elétrico
   *     responses:
   *       '201':
   *         description: Pokémon criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: string
   *       '500':
   *         description: Falha ao criar o Pokémon
   */
  async create(req: Request, res: Response): Promise<void> {
    const { name, type } = req.body;

    const pokemon = new Pokemon();
    pokemon.name = name;
    pokemon.type = type;

    const createdPokemon = await new PokemonRepository().insert(pokemon);

    if (createdPokemon) {
      res.status(201).json({ data: pokemon });
    } else {
      res.status(500).json({ data: 'Erro ao criar Pokémon.' });
    }
  }

  /**
   * @swagger
   * /pokemon:
   *   get:
   *     summary: Retorna a lista de Pokémons cadastrados
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *          description: Lista de Pokémons retornados com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: object
   *       '500':
   *          description: Erro interno do servidor
   */
  async list(req: Request, res: Response) {
    /* 
    ======================================================================
    CÓDIGO ANTIGO (RUIM) - ATIVO PARA TESTAR O "ANTES"
    ======================================================================
    */
    // const [items, total] = await new PokemonRepository().findAndCount();

    // const pokemons = {
    //   items: items,
    //   total: total
    // };

    // return res.status(200).send({ data: pokemons });

    // ... (Restante do arquivo permanece igual acima, apenas injetamos o cache no código novo)

    // ======================================================================
    // CÓDIGO NOVO (PAGINADO + CACHE EM MEMÓRIA)
    // ======================================================================

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const take = limit > 100 ? 100 : limit;
    const skip = (page - 1) * take;

    // 1. Verifica se essa consulta já foi feita nos últimos 10 segundos
    const cacheKey = `pokemons_page_${page}_limit_${take}`;
    if (memoryCache.has(cacheKey)) {
      const cachedItem = memoryCache.get(cacheKey)!;

      // Se não estiver expirado, devolve direto da memória (Tempo de reposta de ~2ms)
      if (Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
        return res.status(200).send({
          data: cachedItem.data,
          _meta: { source: 'cache_memory' } // Ajuda a debugar
        });
      }
    }

    // 2. Se não tem no cache (ou expirou), vai no banco de dados (MySQL)
    const [items, total] = await new PokemonRepository().findAndCount({
      take,
      skip,
      order: {
        id: 'DESC'
      }
    });

    const pokemons = {
      items: items,
      total: total,
      page: page,
      limit: take,
      totalPages: Math.ceil(total / take)
    };

    // 3. Salva a resposta no Cache para os próximos usuários
    memoryCache.set(cacheKey, { timestamp: Date.now(), data: pokemons });

    return res.status(200).send({
      data: pokemons,
      _meta: { source: 'database' }
    });
  }

  /**
   * @swagger
   * /pokemon/count:
   *   get:
   *     summary: Retorna a contagem total de Pokémon
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *          description: Contagem de Pokémon retornada com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  total:
   *                    type: number
   *       '500':
   *          description: Erro interno do servidor
   */
  async count(req: Request, res: Response) {
    const total = await new PokemonRepository().count();

    return res.status(200).send({ total });
  }

  /**
   * @swagger
   * /pokemon/{name}:
   *   get:
   *     summary: Retorna um Pokémon específico pelo nome
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         description: Nome do Pokémon que deseja buscar
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *          description: Pokémon encontrado com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: object
   *       '404':
   *          description: Pokémon não encontrado
   *       '500':
   *          description: Erro interno do servidor
   */
  async getOne(req: Request, res: Response) {
    const name = req.params.name;

    const pokemon = await new PokemonRepository().findOne({ where: { name } });

    return res.status(pokemon ? 200 : 404).send({ data: pokemon });
  }

  /**
   * @swagger
   * /pokemon:
   *   delete:
   *     summary: Remove todos os Pokemóns cadastrados
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *          description: Pokemons excluídos com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: string
   *       '500':
   *          description: Erro interno do servidor
   */
  async delete(req: Request, res: Response) {
    await new PokemonRepository().clear();
    return res.status(200).send({ data: 'Pokemons excluídos com sucesso!' });
  }
}
