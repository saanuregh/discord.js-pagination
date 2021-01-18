import { Message, MessageEmbed, MessageReaction, ReactionCollectorOptions, User } from "discord.js";

interface PaginationOptions extends ReactionCollectorOptions {
  deleteOnEnd?: boolean,
  useUtil?: boolean,
  emojiList?: string[],
  collectorFilter?(reaction: MessageReaction, user: User): boolean | Promise<boolean>
  footerResolver(pageIndex: number, pagesLength: number): string,
  pageResolver(pages: MessageEmbed[], emojiList: string[], currentPageIndex: number, reaction: MessageReaction): number | Promise<number>
}

declare function paginationEmbed (msg: Message, pages: MessageEmbed[], paginationOptions?: PaginationOptions): Promise<Message>

export = paginationEmbed;
