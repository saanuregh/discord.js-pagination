'use strict';
const fetch = require('node-fetch');
const pokeApiUrl = 'https://pokeapi.co/api/v2/';

module.exports.constructPokemonOptions = pokemonApiResponse => {
  const pokemonOptions = [];
  pokemonApiResponse.forEach(pokemon => {
    const splitPokemonUrl = pokemon.url.split('/');
    const pokemonNumber = splitPokemonUrl[splitPokemonUrl.length - 2];
    pokemonOptions.push({
      label: `#${`${pokemonNumber}`.padStart(3, '0')} - ${pokemon.name}`,
      value: pokemon.name,
    });
  });
  return pokemonOptions;
};

module.exports.PokeAPI = {
  getType: type => fetch(`${pokeApiUrl}type/${type}`).then(res => res.json()),
  getTypes: () =>
    fetch(`${pokeApiUrl}type/`)
      .then(res => res.json())
      .then(jsonData => jsonData.results),
  getPokemonOfType: type => fetch(`${pokeApiUrl}type/${type}`).then(res => res.json()),
  getPokemonListOfType: async (type, start, end) => {
    const pokemonTypeResponse = await fetch(`${pokeApiUrl}type/${type}`).then(res => res.json());
    return pokemonTypeResponse.pokemon.slice(start, end).map(entry => entry.pokemon);
  },
  getPokemon: name => fetch(`${pokeApiUrl}pokemon/${name}`).then(res => res.json()),
  getAllPokemon: () => fetch(`${pokeApiUrl}pokemon/`).then(res => res.json()),
  getPokemonList: (limit, offset) =>
    fetch(`${pokeApiUrl}pokemon?limit=${limit}&offset=${offset}`)
      .then(res => res.json())
      .then(jsonData => jsonData.results),
};
