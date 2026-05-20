# Pokémon API Performance Test 🚀

Este projeto é um estudo prático de Engenharia de Software focado em **Testes de Carga e Otimização de Performance**. O objetivo principal é demonstrar como o uso inadequado de consultas no banco de dados pode derrubar uma API e como técnicas modernas (Paginação e Cache em Memória) podem escalar a vazão de requisições.

## 📁 Estrutura do Projeto

O repositório é dividido em dois subprojetos principais, ambos totalmente *dockerizados* e que se comunicam através de uma rede interna do Docker (`node-api-connect`).

### 1. `node-api-boilerplate/` (O Alvo 🎯)
Uma API REST construída com Node.js, Express e TypeORM, conectada a um banco de dados MySQL. 
*   **Papel:** É o servidor que sofrerá o teste de estresse. 
*   **Foco do Teste:** O endpoint `GET /pokemon`.
*   **Cenário Real:** O banco de dados foi previamente populado com **100.000 registros** de Pokémons (usando um script de *Seed*). 
*   **Otimizações Aplicadas:** O código contém duas abordagens. A antiga (sem limite de paginação, que causa sobrecarga de memória) e a nova (com limite de 50 itens via `skip/take` no MySQL + In-Memory Cache de 10 segundos).

### 2. `locust-performance-test/` (O Atacante ⚡)
Um ambiente de teste de carga configurado usando a ferramenta **Locust** (escrito em Python).
*   **Papel:** Disparar milhares de requisições simultâneas contra o servidor Node.js.
*   **Arquitetura:** Roda em um modelo de *Master/Worker* no Docker para suportar alta geração de carga sem engargalar.
*   **Execução:** Configurado para testar especificamente o endpoint `http://node-api:4444/pokemon`.

---

## 🛠️ Como Executar

### 1. Subindo a API e o Banco de Dados
Abra um terminal na pasta `node-api-boilerplate` e execute:
```bash
docker compose up -d
```
*Aguarde a mensagem de "Database initialized" nos logs. A API ficará disponível na porta `4444`.*

**(Opcional) Populando o banco de dados com 100k registros:**
Caso seja a primeira execução e o banco esteja vazio, rode o script de seed:
```bash
npx ts-node src/seed.ts
```

### 2. Subindo o Locust
Abra outro terminal na pasta `locust-performance-test` e execute:
```bash
docker compose up -d
```
*A interface web do Locust ficará disponível em `http://localhost:8089`.*

---

## 📊 Como testar o "Antes e Depois"

1. **Testando o "Antes" (Desastre de Performance):**
   - Vá no arquivo `PokemonController.ts` na pasta da API.
   - Deixe ativo o código que faz `findAndCount()` sem paginação.
   - Acesse o Locust (`http://localhost:8089`), inicie um teste com **100 usuários** e **10 spawn rate**.
   - **Resultado Esperado:** 100% de falha, timeout da API e consumo excessivo de CPU.

2. **Testando o "Depois" (Paginação + Cache):**
   - No `PokemonController.ts`, comente o código ruim e ative o código paginado que utiliza o `memoryCache`.
   - O *nodemon* vai reiniciar a API automaticamente.
   - Vá no Locust e repita o teste com **100 usuários**.
   - **Resultado Esperado:** 0% de falhas, vazão de mais de **1.000 Requisições Por Segundo (RPS)** e tempo de resposta na casa dos **2ms**.

---
*Projeto desenvolvido para fins acadêmicos e demonstração prática de gargalos de performance.*
