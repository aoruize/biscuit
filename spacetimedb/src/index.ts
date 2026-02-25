import { schema, t, table, SenderError } from 'spacetimedb/server';

const AVATAR_COLORS = [
  '#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
  '#f47b67', '#e78fda', '#9b84ec', '#45ddc0', '#3ba55c',
];

function pickAvatarColor(identity: { toHexString(): string }): string {
  const hex = identity.toHexString();
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) - hash + hex.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const user = table(
  { name: 'user', public: true },
  {
    identity: t.identity().primaryKey(),
    username: t.string().optional(),
    online: t.bool(),
    avatarColor: t.string(),
  }
);

const channel = table(
  { name: 'channel', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    name: t.string(),
    topic: t.string(),
    createdBy: t.identity(),
    createdAt: t.timestamp(),
  }
);

const message = table(
  {
    name: 'message',
    public: true,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    channelId: t.u64(),
    threadId: t.u64(),
    sourceThreadId: t.u64(),
    sender: t.identity(),
    text: t.string(),
    sent: t.timestamp(),
    edited: t.bool(),
    alsoSentToChannel: t.bool(),
  }
);

const thread = table(
  {
    name: 'thread',
    public: true,
  },
  {
    id: t.u64().primaryKey().autoInc(),
    channelId: t.u64(),
    parentMessageId: t.u64(),
    name: t.string(),
    createdBy: t.identity(),
    createdAt: t.timestamp(),
    lastActivity: t.timestamp(),
    replyCount: t.u64(),
  }
);

const typing_indicator = table(
  {
    name: 'typing_indicator',
    public: true,
  },
  {
    identity: t.identity().primaryKey(),
    channelId: t.u64(),
    threadId: t.u64(),
    startedAt: t.timestamp(),
  }
);

const reaction = table(
  {
    name: 'reaction',
    public: true,
    indexes: [{ name: 'reaction_message_id', algorithm: 'btree', columns: ['messageId'] }],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    messageId: t.u64(),
    emoji: t.string(),
    reactor: t.identity(),
  }
);

const spacetimedb = schema({ user, channel, message, thread, typing_indicator, reaction });
export default spacetimedb;

export const set_name = spacetimedb.reducer(
  { username: t.string() },
  (ctx, { username }) => {
    const trimmed = username.trim();
    if (!trimmed) throw new SenderError('Username must not be empty');
    if (trimmed.length > 32) throw new SenderError('Username must be 32 characters or less');

    const u = ctx.db.user.identity.find(ctx.sender);
    if (!u) throw new SenderError('User not found');
    ctx.db.user.identity.update({ ...u, username: trimmed });
  }
);

export const create_channel = spacetimedb.reducer(
  { name: t.string(), topic: t.string() },
  (ctx, { name, topic }) => {
    const trimmed = name.trim();
    if (!trimmed) throw new SenderError('Channel name must not be empty');
    if (trimmed.length > 100) throw new SenderError('Channel name too long');

    ctx.db.channel.insert({
      id: 0n,
      name: trimmed.toLowerCase().replace(/\s+/g, '-'),
      topic: topic.trim(),
      createdBy: ctx.sender,
      createdAt: ctx.timestamp,
    });
  }
);

export const delete_channel = spacetimedb.reducer(
  { channelId: t.u64() },
  (ctx, { channelId }) => {
    const ch = ctx.db.channel.id.find(channelId);
    if (!ch) throw new SenderError('Channel not found');

    for (const msg of ctx.db.message.iter()) {
      if (msg.channelId === channelId) {
        ctx.db.message.id.delete(msg.id);
      }
    }

    for (const th of ctx.db.thread.iter()) {
      if (th.channelId === channelId) {
        ctx.db.thread.id.delete(th.id);
      }
    }

    ctx.db.channel.id.delete(channelId);
  }
);

export const update_channel_topic = spacetimedb.reducer(
  { channelId: t.u64(), topic: t.string() },
  (ctx, { channelId, topic }) => {
    const ch = ctx.db.channel.id.find(channelId);
    if (!ch) throw new SenderError('Channel not found');
    ctx.db.channel.id.update({ ...ch, topic: topic.trim() });
  }
);

export const send_message = spacetimedb.reducer(
  { channelId: t.u64(), text: t.string() },
  (ctx, { channelId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new SenderError('Message must not be empty');
    if (trimmed.length > 2000) throw new SenderError('Message too long');

    const ch = ctx.db.channel.id.find(channelId);
    if (!ch) throw new SenderError('Channel not found');

    const row = ctx.db.message.insert({
      id: 0n,
      channelId,
      threadId: 0n,
      sourceThreadId: 0n,
      sender: ctx.sender,
      text: trimmed,
      sent: ctx.timestamp,
      edited: false,
      alsoSentToChannel: false,
    });

    ctx.db.thread.insert({
      id: 0n,
      channelId,
      parentMessageId: row.id,
      name: trimmed.substring(0, 50),
      createdBy: ctx.sender,
      createdAt: ctx.timestamp,
      lastActivity: ctx.timestamp,
      replyCount: 0n,
    });

    const existing = ctx.db.typing_indicator.identity.find(ctx.sender);
    if (existing) ctx.db.typing_indicator.identity.delete(ctx.sender);
  }
);

export const edit_message = spacetimedb.reducer(
  { messageId: t.u64(), text: t.string() },
  (ctx, { messageId, text }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new SenderError('Message must not be empty');
    if (trimmed.length > 2000) throw new SenderError('Message too long');

    const msg = ctx.db.message.id.find(messageId);
    if (!msg) throw new SenderError('Message not found');
    if (msg.sender.toHexString() !== ctx.sender.toHexString()) {
      throw new SenderError('Can only edit your own messages');
    }
    ctx.db.message.id.update({ ...msg, text: trimmed, edited: true });
  }
);

export const delete_message = spacetimedb.reducer(
  { messageId: t.u64() },
  (ctx, { messageId }) => {
    const msg = ctx.db.message.id.find(messageId);
    if (!msg) throw new SenderError('Message not found');
    if (msg.sender.toHexString() !== ctx.sender.toHexString()) {
      throw new SenderError('Can only delete your own messages');
    }

    if (msg.threadId === 0n) {
      for (const th of ctx.db.thread.iter()) {
        if (th.parentMessageId === messageId) {
          for (const reply of ctx.db.message.iter()) {
            if (reply.threadId === th.id) {
              for (const r of ctx.db.reaction.iter()) {
                if (r.messageId === reply.id) ctx.db.reaction.id.delete(r.id);
              }
              ctx.db.message.id.delete(reply.id);
            }
          }
          ctx.db.thread.id.delete(th.id);
        }
      }
    }

    for (const r of ctx.db.reaction.iter()) {
      if (r.messageId === messageId) ctx.db.reaction.id.delete(r.id);
    }

    ctx.db.message.id.delete(messageId);
  }
);

export const create_thread = spacetimedb.reducer(
  { channelId: t.u64(), parentMessageId: t.u64(), name: t.string() },
  (ctx, { channelId, parentMessageId, name }) => {
    const ch = ctx.db.channel.id.find(channelId);
    if (!ch) throw new SenderError('Channel not found');

    const parentMsg = ctx.db.message.id.find(parentMessageId);
    if (!parentMsg) throw new SenderError('Parent message not found');

    const trimmed = name.trim() || parentMsg.text.substring(0, 50);

    ctx.db.thread.insert({
      id: 0n,
      channelId,
      parentMessageId,
      name: trimmed,
      createdBy: ctx.sender,
      createdAt: ctx.timestamp,
      lastActivity: ctx.timestamp,
      replyCount: 0n,
    });
  }
);

export const send_thread_reply = spacetimedb.reducer(
  { threadId: t.u64(), text: t.string(), alsoSendToChannel: t.bool() },
  (ctx, { threadId, text, alsoSendToChannel }) => {
    const trimmed = text.trim();
    if (!trimmed) throw new SenderError('Message must not be empty');
    if (trimmed.length > 2000) throw new SenderError('Message too long');

    const th = ctx.db.thread.id.find(threadId);
    if (!th) throw new SenderError('Thread not found');

    ctx.db.message.insert({
      id: 0n,
      channelId: th.channelId,
      threadId,
      sourceThreadId: 0n,
      sender: ctx.sender,
      text: trimmed,
      sent: ctx.timestamp,
      edited: false,
      alsoSentToChannel,
    });

    if (alsoSendToChannel) {
      ctx.db.message.insert({
        id: 0n,
        channelId: th.channelId,
        threadId: 0n,
        sourceThreadId: threadId,
        sender: ctx.sender,
        text: trimmed,
        sent: ctx.timestamp,
        edited: false,
        alsoSentToChannel: false,
      });
    }

    ctx.db.thread.id.update({
      ...th,
      lastActivity: ctx.timestamp,
      replyCount: th.replyCount + 1n,
    });

    const existing = ctx.db.typing_indicator.identity.find(ctx.sender);
    if (existing) ctx.db.typing_indicator.identity.delete(ctx.sender);
  }
);

export const set_typing = spacetimedb.reducer(
  { channelId: t.u64(), threadId: t.u64() },
  (ctx, { channelId, threadId }) => {
    const existing = ctx.db.typing_indicator.identity.find(ctx.sender);
    if (existing) {
      ctx.db.typing_indicator.identity.update({
        ...existing,
        channelId,
        threadId,
        startedAt: ctx.timestamp,
      });
    } else {
      ctx.db.typing_indicator.insert({
        identity: ctx.sender,
        channelId,
        threadId,
        startedAt: ctx.timestamp,
      });
    }
  }
);

export const clear_typing = spacetimedb.reducer(
  (ctx) => {
    const existing = ctx.db.typing_indicator.identity.find(ctx.sender);
    if (existing) ctx.db.typing_indicator.identity.delete(ctx.sender);
  }
);

export const toggle_reaction = spacetimedb.reducer(
  { messageId: t.u64(), emoji: t.string() },
  (ctx, { messageId, emoji }) => {
    const msg = ctx.db.message.id.find(messageId);
    if (!msg) throw new SenderError('Message not found');

    const senderHex = ctx.sender.toHexString();
    for (const r of ctx.db.reaction.reaction_message_id.filter(messageId)) {
      if (r.emoji === emoji && r.reactor.toHexString() === senderHex) {
        ctx.db.reaction.id.delete(r.id);
        return;
      }
    }

    ctx.db.reaction.insert({
      id: 0n,
      messageId,
      emoji,
      reactor: ctx.sender,
    });
  }
);

export const moduleInit = spacetimedb.init((ctx) => {
  ctx.db.channel.insert({
    id: 0n,
    name: 'general',
    topic: 'General discussion',
    createdBy: ctx.sender,
    createdAt: ctx.timestamp,
  });
  ctx.db.channel.insert({
    id: 0n,
    name: 'random',
    topic: 'Off-topic conversation',
    createdBy: ctx.sender,
    createdAt: ctx.timestamp,
  });
  ctx.db.channel.insert({
    id: 0n,
    name: 'introductions',
    topic: 'Introduce yourself!',
    createdBy: ctx.sender,
    createdAt: ctx.timestamp,
  });
});

export const onConnect = spacetimedb.clientConnected((ctx) => {
  const u = ctx.db.user.identity.find(ctx.sender);
  if (u) {
    ctx.db.user.identity.update({ ...u, online: true });
  } else {
    ctx.db.user.insert({
      identity: ctx.sender,
      username: undefined,
      online: true,
      avatarColor: pickAvatarColor(ctx.sender),
    });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected((ctx) => {
  const u = ctx.db.user.identity.find(ctx.sender);
  if (u) {
    ctx.db.user.identity.update({ ...u, online: false });
    const typing = ctx.db.typing_indicator.identity.find(ctx.sender);
    if (typing) ctx.db.typing_indicator.identity.delete(ctx.sender);
  }
});
