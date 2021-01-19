import { EmojiIdentifierResolvable, Message, MessageEmbed, MessageReaction, ReactionCollectorOptions, User } from "discord.js";

interface PaginationOptions extends ReactionCollectorOptions {
  deleteOnEnd?: boolean;
  useUtil?: boolean;
  emojiList?: EmojiIdentifierResolvable[];
  collectorFilter?(reaction: MessageReaction, user: User): boolean | Promise<boolean>;
  footerResolver?(pageIndex: number, pagesLength: number): string;
  pageResolver?(msg: Message, pages: MessageEmbed[], emojiList: string[], currentPageIndex: number, reaction: MessageReaction): number | Promise<number>;
  sendMessage?(message: Message, pageEmbed: MessageEmbed): Promise<Message>;
}

declare function paginationEmbed(msg: Message, pages: MessageEmbed[], paginationOptions?: PaginationOptions): Promise<Message>;

export = paginationEmbed;
