'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection, EmbedBuilder, ComponentType, ButtonStyle, SelectMenuOptionBuilder } = require('discord.js');
const { PaginatorEvents, ActionRowPaginator } = require('../../../src');
const { basicEndHandler, basicErrorHandler } = require('../util/Constants');
const { constructPokemonOptions, PokeAPI } = require('../util/PokeAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advanced-pagination')
    .setDescription('Replies with a dynamic advanced pagination'),
  async execute(interaction) {
    const SELECT_LIMIT = 25;
    const INITIAL_SELECT_IDENTIFIER = 0;
    const INITIAL_TYPE_IDENTIFIER = 'all';

    const pokemonTypesResponse = await PokeAPI.getTypes();
    const pokemonTypeSelectOptions = [{ label: INITIAL_TYPE_IDENTIFIER, value: INITIAL_TYPE_IDENTIFIER }];
    const allPokemonRequest = await PokeAPI.getAllPokemon();

    let totalPokemonOfType = allPokemonRequest.count;
    let maxPokemonSelections = Math.floor(totalPokemonOfType / SELECT_LIMIT);
    if (totalPokemonOfType % SELECT_LIMIT > 0) maxPokemonSelections += 1;

    pokemonTypesResponse.forEach(type => {
      if (type.name !== 'unknown') {
        pokemonTypeSelectOptions.push({
          label: type.name,
          value: type.name,
        });
      }
    });

    const pokemonSelectOptions = new Collection();
    const initialPokemon = await PokeAPI.getPokemonList(SELECT_LIMIT, INITIAL_SELECT_IDENTIFIER);
    pokemonSelectOptions.set(INITIAL_SELECT_IDENTIFIER, constructPokemonOptions(initialPokemon));

    const messageActionRows = [
      {
        components: [
          {
            type: ComponentType.SelectMenu,
            placeholder: 'Select a type to filter the Pokemon',
            options: pokemonTypeSelectOptions,
            customId: 'pokemon-type',
            minItems: 1,
            maxItems: 1,
          },
        ],
      },
      {
        components: [
          {
            type: ComponentType.SelectMenu,
            placeholder: `Currently viewing #001 - #025 of ${totalPokemonOfType}`,
            options: pokemonSelectOptions.get(INITIAL_SELECT_IDENTIFIER),
            customId: 'pokemon-select',
            minItems: 1,
            maxItems: 1,
          },
        ],
      },
      {
        components: [
          {
            type: ComponentType.Button,
            emoji: '⏪',
            label: 'start',
            style: ButtonStyle.Secondary,
          },
          {
            type: ComponentType.Button,
            label: `-${SELECT_LIMIT}`,
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            label: `+${SELECT_LIMIT}`,
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            emoji: '⏩',
            label: 'end',
            style: ButtonStyle.Secondary,
          },
        ],
      },
    ];

    const handleButtonIdentifier = async (label, paginator) => {
      // Handles a button based navigation, this is considered an "action" which will be used
      // to change / update the existing selectOptionsIdentifier.
      let { pokemonTypeIdentifier, selectOptionsIdentifier } = paginator.currentIdentifiers;
      switch (label) {
        case 'start':
          selectOptionsIdentifier = INITIAL_SELECT_IDENTIFIER;
          break;
        case `-${SELECT_LIMIT}`:
          selectOptionsIdentifier -= 1;
          break;
        case `+${SELECT_LIMIT}`:
          selectOptionsIdentifier += 1;
          break;
        case 'end':
          selectOptionsIdentifier = maxPokemonSelections - 1;
          break;
      }

      // If the select identifier becomes out of bounds, make it cyclic
      if (selectOptionsIdentifier < INITIAL_SELECT_IDENTIFIER) {
        selectOptionsIdentifier = maxPokemonSelections + (selectOptionsIdentifier % maxPokemonSelections);
      } else if (selectOptionsIdentifier >= maxPokemonSelections) {
        selectOptionsIdentifier %= maxPokemonSelections;
      }
      // Determine whether we are requesting based on type or pokemon name.
      const isAll = pokemonTypeIdentifier === INITIAL_TYPE_IDENTIFIER;
      // If the select options aren't cached, fetch and cache them.
      if (!pokemonSelectOptions.has(selectOptionsIdentifier)) {
        const offset = selectOptionsIdentifier * SELECT_LIMIT;
        const limit =
          selectOptionsIdentifier === maxPokemonSelections - 1 ? totalPokemonOfType % SELECT_LIMIT : SELECT_LIMIT;
        try {
          const pokemonList = isAll
            ? await PokeAPI.getPokemonList(limit, offset)
            : await PokeAPI.getPokemonListOfType(pokemonTypeIdentifier, offset, offset + limit);
          console.log(`COnstructiong new options based on start/end: ${offset}/${offset + limit}`);
          pokemonSelectOptions.set(selectOptionsIdentifier, constructPokemonOptions(pokemonList));
        } catch (error) {
          console.log(`ERROR FETCHING POKEMON LIST:\n${error}`);
          return {};
        }
      }
      return { selectOptionsIdentifier };
    };

    const handlePokemonTypeChange = async pokemonType => {
      // Handles when a type option or 'all' is selected.
      console.log(`Handling type change to '${pokemonType}'`);
      // Currently the select options are only cached per-type.
      // Could cache them all with collections mapped to a type.
      pokemonSelectOptions.clear();
      const isAll = pokemonType === INITIAL_TYPE_IDENTIFIER;
      try {
        const pokemonResponse = isAll ? await PokeAPI.getAllPokemon() : await PokeAPI.getPokemonOfType(pokemonType);
        const pokemonList = isAll ? pokemonResponse.results : pokemonResponse.pokemon;
        if (isAll) {
          totalPokemonOfType = pokemonResponse.count;
        } else {
          totalPokemonOfType = pokemonResponse.pokemon.length;
        }
        console.log(`Total pokemon of type '${pokemonType}': ${totalPokemonOfType}`);
        maxPokemonSelections = Math.floor(totalPokemonOfType / SELECT_LIMIT);
        if (totalPokemonOfType % SELECT_LIMIT > 0) maxPokemonSelections += 1;
        pokemonSelectOptions.set(
          INITIAL_SELECT_IDENTIFIER,
          constructPokemonOptions(
            isAll
              ? pokemonList
              : pokemonList.slice(INITIAL_SELECT_IDENTIFIER, SELECT_LIMIT).map(pokemonEntry => pokemonEntry.pokemon),
          ).map(option => option),
        );
        return { selectOptionsIdentifier: INITIAL_SELECT_IDENTIFIER, pokemonTypeIdentifier: pokemonType };
      } catch (error) {
        console.log(`Error in handlePokemonTypeChange\n${error}`);
        return {};
      }
    };

    // eslint-disable-next-line no-shadow
    const identifiersResolver = async ({ interaction, paginator }) => {
      let newIdentifiers = {};
      if (interaction.componentType === ComponentType.Button) {
        newIdentifiers = await handleButtonIdentifier(interaction.component.label, paginator);
      } else if (interaction.componentType === ComponentType.SelectMenu) {
        if (interaction.component.customId.includes('pokemon-type')) {
          const { pokemonTypeIdentifier: currentPokemonType } = paginator.currentIdentifiers;
          const newPokemonType = interaction.values[0];
          if (newPokemonType !== currentPokemonType) {
            newIdentifiers = await handlePokemonTypeChange(newPokemonType, paginator);
          }
        } else if (interaction.component.customId.includes('pokemon-select')) {
          newIdentifiers = {
            pageIdentifier: interaction.values[0],
          };
        }
      }
      return { ...paginator.currentIdentifiers, ...newIdentifiers };
    };

    const pageEmbedResolver = async ({ newIdentifiers, currentIdentifiers, paginator }) => {
      const { pageIdentifier: newPageIdentifier } = newIdentifiers;
      const { pageIdentifier: currentPageIdentifier } = currentIdentifiers;
      if (newPageIdentifier !== currentPageIdentifier) {
        try {
          // Pokemon name
          const pokemonResult = await PokeAPI.getPokemon(newPageIdentifier);
          const newEmbed = new EmbedBuilder()
            .setTitle(`Pokedex #${`${pokemonResult.id}`.padStart(3, '0')} - ${newPageIdentifier}`)
            .setDescription(`Viewing ${newPageIdentifier}`)
            .setThumbnail(pokemonResult.sprites.front_default)
            .setFooter({ text: 'Information fetched from https://pokeapi.co/' })
            .addFields([
              {
                name: 'Types',
                value: pokemonResult.types.map(typeObject => typeObject.type.name).join(', '),
                inline: true,
              },
              {
                name: 'Abilities',
                value: pokemonResult.abilities.map(abilityObject => abilityObject.ability.name).join(', '),
                inline: false,
              },
            ]);
          const pokemonEmbedFields = [];
          pokemonResult.stats.forEach(statObject => {
            pokemonEmbedFields.push({ name: statObject.stat.name, value: `${statObject.base_stat}`, inline: true});
          });
          newEmbed.addFields(pokemonEmbedFields);
          return newEmbed;
        } catch (error) {
          console.log(`Error in pageEmbedResolver\n${error}`);
        }
      }
      return paginator.currentPage;
    };

    const handleBeforePageChanged = ({ newIdentifiers, currentIdentifiers, paginator }) => {
      const {
        selectOptionsIdentifier: currentSelectOptionsIdentifier,
        pokemonTypeIdentifier: currentPokemonTypeIdentifier,
      } = currentIdentifiers;
      const { selectOptionsIdentifier: newSelectOptionsIdentifier, pokemonTypeIdentifier: newPokemonTypeIdentifier } =
        newIdentifiers;

      if (newPokemonTypeIdentifier !== currentPokemonTypeIdentifier) {
        paginator.getComponent(0, 0).placeholder =
          newPokemonTypeIdentifier === INITIAL_TYPE_IDENTIFIER
            ? 'Select a type to filter the Pokemon'
            : `Currently filtered on the '${newPokemonTypeIdentifier}' type`;
      }

      if (
        newSelectOptionsIdentifier !== currentSelectOptionsIdentifier ||
        newPokemonTypeIdentifier !== currentPokemonTypeIdentifier
      ) {
        paginator.getComponent(1, 0).setOptions(pokemonSelectOptions.get(newSelectOptionsIdentifier));
        const endOffset = newSelectOptionsIdentifier * SELECT_LIMIT + SELECT_LIMIT;
        paginator.getComponent(1, 0).placeholder = `Currently viewing #${`${
          newSelectOptionsIdentifier * SELECT_LIMIT + 1
        }`.padStart(3, '0')} - #${`${endOffset >= totalPokemonOfType ? totalPokemonOfType : endOffset} `.padStart(
          3,
          '0',
        )} of #${totalPokemonOfType}`;
      }
    };

    const shouldChangePage = ({ newIdentifiers, currentIdentifiers }) => {
      const {
        pageIdentifier: newPageIdentifier,
        selectOptionsIdentifier: newSelectOptionsIdentifier,
        pokemonTypeIdentifier: newPokemonTypeIdentifier,
      } = newIdentifiers;
      const {
        pageIdentifier: currentPageIdentifier,
        selectOptionsIdentifier: currentSelectOptionsIdentifier,
        pokemonTypeIdentifier: currentPokemonTypeIdentifier,
      } = currentIdentifiers;

      return (
        newPageIdentifier !== currentPageIdentifier ||
        newSelectOptionsIdentifier !== currentSelectOptionsIdentifier ||
        newPokemonTypeIdentifier !== currentPokemonTypeIdentifier
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
        pokemonTypeIdentifier: INITIAL_TYPE_IDENTIFIER,
        pageIdentifier: 'bulbasaur',
        selectOptionsIdentifier: INITIAL_SELECT_IDENTIFIER,
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
