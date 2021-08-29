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
    const maxSelectIdentifier = 150 / variation;
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
    let selectIdentifier = 0;
    const initialPokemon = await fetch(`${pokemonApiUrl}pokemon?limit=${variation}&offset=0`).then(res => res.json());

    const constructPokemonOptions = pokemonApiResponse => {
      const pokemonOptions = [];
      pokemonApiResponse.results.forEach(pokemon => {
        const splitPokemonUrl = pokemon.url.split('/');
        const pokemonNumber = splitPokemonUrl[splitPokemonUrl.length - 2];
        pokemonOptions.push({
          label: `${`${pokemonNumber}`.padStart(3, '0')} - ${pokemon.name}`,
          value: pokemon.name,
        });
      });
      return pokemonOptions;
    };

    pokemonSelectOptions.set(0, constructPokemonOptions(initialPokemon));

    messageActionRows[1].components[0].options = pokemonSelectOptions.get(selectIdentifier);

    // eslint-disable-next-line no-shadow
    const pageIdentifierResolver = ({ interaction }) => {
      if (interaction.componentType === 'BUTTON') {
        return interaction.component.label;
      } else if (interaction.componentType === 'SELECT_MENU') {
        return interaction.values[0];
      }
      return null;
    };

    const pageMessageOptionsResolver = async ({ newPageIdentifier, paginator }) => {
      switch (newPageIdentifier) {
        case 'start':
          selectIdentifier = 0;
          break;
        case `-${variation}`:
          selectIdentifier -= 1;
          break;
        case `+${variation}`:
          selectIdentifier += 1;
          break;
        case 'end':
          selectIdentifier = maxSelectIdentifier;
          break;
        default: {
          // Pokemon name
          const pokemonResult = await fetch(`${pokemonApiUrl}pokemon/${newPageIdentifier}`).then(res => res.json());
          const newEmbed = new MessageEmbed()
            .setTitle(`${`${pokemonResult.id}`.padStart(3, '0')} - ${newPageIdentifier}`)
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
          return { ...paginator.messageOptionComponents, embeds: [newEmbed] };
        }
      }

      const currentPageEmbed = new MessageEmbed(paginator.currentPage.embeds[0]);
      if (!pokemonSelectOptions.has(selectIdentifier)) {
        const limit = selectIdentifier === maxSelectIdentifier ? 1 : variation;
        const url = `${pokemonApiUrl}pokemon?limit=${limit}&offset=${selectIdentifier * variation}`;
        const pokemon = await fetch(url).then(res => res.json());
        const options = constructPokemonOptions(pokemon);
        pokemonSelectOptions.set(selectIdentifier, options);
      }
      paginator.getComponent(1, 0).options = pokemonSelectOptions.get(selectIdentifier);
      if (selectIdentifier === maxSelectIdentifier) {
        paginator.getComponent(1, 0).placeholder = `Currently viewing #151 - #151`;
      } else {
        paginator.getComponent(1, 0).placeholder = `Currently viewing #${`${selectIdentifier * variation}`.padStart(
          3,
          '0',
        )} - #${`${selectIdentifier * variation + variation}`.padStart(3, '0')}`;
      }
      return { ...paginator.messageOptionComponents, embeds: [currentPageEmbed] };
    };

    const actionRowPaginator = new ActionRowPaginator(interaction, {
      startingPageIdentifier: 'bulbasaur',
      useCache: false,
      messageActionRows,
      pageIdentifierResolver,
      pageMessageOptionsResolver,
      shouldChangePage: () => true,
    })
      .on(PaginatorEvents.COLLECT_ERROR, basicErrorHandler)
      .on(PaginatorEvents.PAGINATION_END, basicEndHandler);
    await actionRowPaginator.send();
    return actionRowPaginator.message;
  },
};
