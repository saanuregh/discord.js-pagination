'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection, MessageEmbed } = require('discord.js');
const { PaginatorEvents, ActionRowPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler } = require('../util/Constants');
const { constructPokemonOptions, PokeAPI } = require('../util/PokeAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('action-row-pagination')
    .setDescription('Replies with a dynamic advanced pagination'),
  async execute(interaction) {
    const SELECT_LIMIT = 25;
    const MAX_POKEMON = 151;
    const MAX_SELECTIONS = Math.floor(MAX_POKEMON / SELECT_LIMIT) + (MAX_POKEMON % SELECT_LIMIT > 0 ? 1 : 0);
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
            label: `-${SELECT_LIMIT}`,
            style: 'PRIMARY',
          },
          {
            type: 'BUTTON',
            label: `+${SELECT_LIMIT}`,
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

    const pokemonSelectOptions = new Collection();
    const initialSelectIdentifier = 0;

    const initialPokemon = await PokeAPI.getPokemonList(SELECT_LIMIT, initialSelectIdentifier);
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
          case `-${SELECT_LIMIT}`:
            selectOptionsIdentifier -= 1;
            break;
          case `+${SELECT_LIMIT}`:
            selectOptionsIdentifier += 1;
            break;
          case 'end':
            selectOptionsIdentifier = MAX_SELECTIONS - 1;
            break;
        }

        if (selectOptionsIdentifier < 0) {
          selectOptionsIdentifier = MAX_SELECTIONS + (selectOptionsIdentifier % MAX_SELECTIONS);
        } else if (selectOptionsIdentifier >= MAX_SELECTIONS) {
          selectOptionsIdentifier %= MAX_SELECTIONS;
        }

        if (!pokemonSelectOptions.has(selectOptionsIdentifier)) {
          const limit = selectOptionsIdentifier === MAX_SELECTIONS - 1 ? 1 : SELECT_LIMIT;
          const pokemon = await PokeAPI.getPokemonList(limit, selectOptionsIdentifier * SELECT_LIMIT);
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
        const pokemonResult = await PokeAPI.getPokemon(newPageIdentifier);
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
        if (newSelectOptionsIdentifier === MAX_SELECTIONS - 1) {
          paginator.getComponent(1, 0).placeholder = `Currently viewing #151 - #151`;
        } else {
          paginator.getComponent(1, 0).placeholder = `Currently viewing #${`${
            newSelectOptionsIdentifier * SELECT_LIMIT + 1
          }`.padStart(3, '0')} - #${`${newSelectOptionsIdentifier * SELECT_LIMIT + SELECT_LIMIT}`.padStart(3, '0')}`;
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
      .on(PaginatorEvents.BEFORE_PAGE_CHANGED, handleBeforePageChanged)
      .on(PaginatorEvents.PAGINATION_END, endHandler);
    await actionRowPaginator.send();
    return actionRowPaginator.message;
  },
};
