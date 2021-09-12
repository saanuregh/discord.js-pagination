'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection, MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const { PaginatorEvents, ActionRowPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler } = require('../util/Constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advanced-pagination')
    .setDescription('Replies with a dynamic advanced pagination'),
  async execute(interaction) {
    const variation = 25;
    const maxPokemon = 151;
    const maxSelectIdentifiers = Math.floor(maxPokemon / variation) + (maxPokemon % variation);
    const messageActionRows = [
      {
        components: [
          {
            type: 'BUTTON',
            emoji: '⏪',
            label: 'start',
            style: 'SECONDARY',
          },
          {
            type: 'BUTTON',
            label: `-${variation}`,
            style: 'PRIMARY',
          },
          {
            type: 'BUTTON',
            label: `+${variation}`,
            style: 'PRIMARY',
          },
          {
            type: 'BUTTON',
            emoji: '⏩',
            label: 'end',
            style: 'SECONDARY',
          },
        ],
      },
      {
        components: [
          {
            type: 'SELECT_MENU',
            placeholder: 'Currently viewing #001 - #025',
          },
        ],
      },
    ];

    const pokemonApiUrl = 'https://pokeapi.co/api/v2/';
    const pokemonSelectOptions = new Collection();
    const initialSelectIdentifier = 0;

    const constructPokemonOptions = pokemonApiResponse => {
      const pokemonOptions = [];
      pokemonApiResponse.results.forEach(pokemon => {
        const splitPokemonUrl = pokemon.url.split('/');
        const pokemonNumber = splitPokemonUrl[splitPokemonUrl.length - 2];
        pokemonOptions.push({
          label: `#${`${pokemonNumber}`.padStart(3, '0')} - ${pokemon.name}`,
          value: pokemon.name,
        });
      });
      return pokemonOptions;
    };

    const initialUrl = `${pokemonApiUrl}pokemon?limit=${variation}&offset=${initialSelectIdentifier}`;
    const initialPokemon = await fetch(initialUrl).then(res => res.json());
    pokemonSelectOptions.set(initialSelectIdentifier, constructPokemonOptions(initialPokemon));

    messageActionRows[1].components[0].options = pokemonSelectOptions.get(initialSelectIdentifier);

    // eslint-disable-next-line no-shadow
    const identifiersResolver = async ({ interaction, paginator }) => {
      if (interaction.componentType === 'BUTTON') {
        let { selectOptionsIdentifier } = paginator.currentIdentifiers;
        switch (interaction.component.label) {
          case 'start':
            selectOptionsIdentifier = paginator.initialIdentifiers.selectOptionsIdentifier;
            break;
          case `-${variation}`:
            selectOptionsIdentifier -= 1;
            break;
          case `+${variation}`:
            selectOptionsIdentifier += 1;
            break;
          case 'end':
            selectOptionsIdentifier = maxSelectIdentifiers - 1;
            break;
        }

        if (selectOptionsIdentifier < 0) {
          selectOptionsIdentifier = maxSelectIdentifiers + (selectOptionsIdentifier % maxSelectIdentifiers);
        } else if (selectOptionsIdentifier >= maxSelectIdentifiers) {
          selectOptionsIdentifier %= maxSelectIdentifiers;
        }

        if (!pokemonSelectOptions.has(selectOptionsIdentifier)) {
          const limit = selectOptionsIdentifier === maxSelectIdentifiers - 1 ? 1 : variation;
          const url = `${pokemonApiUrl}pokemon?limit=${limit}&offset=${selectOptionsIdentifier * variation}`;
          const pokemon = await fetch(url).then(res => res.json());
          pokemonSelectOptions.set(selectOptionsIdentifier, constructPokemonOptions(pokemon));
        }

        return {
          ...paginator.currentIdentifiers,
          selectOptionsIdentifier,
        };
      } else if (interaction.componentType === 'SELECT_MENU') {
        return {
          ...paginator.currentIdentifiers,
          pageIdentifier: interaction.values[0],
        };
      }
      return null;
    };

    const pageEmbedResolver = async ({ newIdentifiers, currentIdentifiers, paginator }) => {
      const { pageIdentifier: newPageIdentifier } = newIdentifiers;
      const { pageIdentifier: currentPageIdentifier } = currentIdentifiers;
      if (newPageIdentifier !== currentPageIdentifier) {
        // Pokemon name
        const pokemonResult = await fetch(`${pokemonApiUrl}pokemon/${newPageIdentifier}`).then(res => res.json());
        const newEmbed = new MessageEmbed()
          .setTitle(`Pokedex #${`${pokemonResult.id}`.padStart(3, '0')} - ${newPageIdentifier}`)
          .setDescription(`Viewing ${newPageIdentifier}`)
          .setThumbnail(pokemonResult.sprites.front_default)
          .addField('Types', pokemonResult.types.map(typeObject => typeObject.type.name).join(', '), true)
          .addField(
            'Abilities',
            pokemonResult.abilities.map(abilityObject => abilityObject.ability.name).join(', '),
            false,
          );
        pokemonResult.stats.forEach(statObject => {
          newEmbed.addField(statObject.stat.name, `${statObject.base_stat}`, true);
        });
        return newEmbed;
      }
      return paginator.currentPage;
    };

    const handleBeforePageChanged = ({ newIdentifiers, currentIdentifiers, paginator }) => {
      const { selectOptionsIdentifier: currentSelectOptionsIdentifier } = currentIdentifiers;
      const { selectOptionsIdentifier: newSelectOptionsIdentifier } = newIdentifiers;
      if (currentSelectOptionsIdentifier !== newSelectOptionsIdentifier) {
        paginator.getComponent(1, 0).options = pokemonSelectOptions.get(newSelectOptionsIdentifier);
        if (newSelectOptionsIdentifier === maxSelectIdentifiers - 1) {
          paginator.getComponent(1, 0).placeholder = `Currently viewing #151 - #151`;
        } else {
          paginator.getComponent(1, 0).placeholder = `Currently viewing #${`${
            newSelectOptionsIdentifier * variation + 1
          }`.padStart(3, '0')} - #${`${newSelectOptionsIdentifier * variation + variation}`.padStart(3, '0')}`;
        }
      }
    };

    const shouldChangePage = ({ newIdentifiers, currentIdentifiers }) => {
      const { pageIdentifier: newPageIdentifier, selectOptionsIdentifier: newSelectOptionsIdentifier } = newIdentifiers;
      const { pageIdentifier: currentPageIdentifier, selectOptionsIdentifier: currentSelectOptionsIdentifier } =
        currentIdentifiers;

      return (
        newPageIdentifier !== currentPageIdentifier || newSelectOptionsIdentifier !== currentSelectOptionsIdentifier
      );
    };

    const endHandler = ({ reason, paginator }) => {
      basicEndHandler({ reason, paginator });
      pokemonSelectOptions.clear();
    };

    const actionRowPaginator = new ActionRowPaginator(interaction, {
      useCache: false,
      messageActionRows,
      initialIdentifiers: {
        pageIdentifier: 'bulbasaur',
        selectOptionsIdentifier: initialSelectIdentifier,
      },
      identifiersResolver,
      pageEmbedResolver,
      shouldChangePage,
    })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler)
      .on(PaginatorEvents.BEFORE_PAGE_CHANGED, handleBeforePageChanged)
      .on(PaginatorEvents.PAGINATION_END, endHandler);
    await actionRowPaginator.send();
    return actionRowPaginator.message;
  },
};
