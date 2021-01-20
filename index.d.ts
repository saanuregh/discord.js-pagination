import { EmojiIdentifierResolvable, Message, MessageEmbed, MessageReaction, ReactionCollectorOptions, User } from "discord.js";

interface PaginationOptions extends ReactionCollectorOptions {
  deleteOnEnd?: boolean;
  emojiList?: EmojiIdentifierResolvable[];
  footerResolver?(pageIndex: number, pagesLength: number): string;
  sendMessage?(receivedMessage: Message, pageEmbed: MessageEmbed): Promise<Message>;
  collectorFilter?(reaction: MessageReaction, user: User): boolean | Promise<boolean>;
  pageResolver?(paginatedEmbedMessage: Message, pages: MessageEmbed[], emojiList: string[], currentPageIndex: number, reaction: MessageReaction): number | Promise<number>;
  collectErrorHandler?(error: Error): void | Promise<void>;
}

declare function paginationEmbed(receivedMessage: Message, pages: MessageEmbed[], paginationOptions?: PaginationOptions): Promise<Message>;

export = paginationEmbed;
