# GraphQL @conversation Transformer

## Reference Documentation

### @conversation

The `@conversation` directive allows you to quickly and easily create Conversation AI Routes within your AWS AppSync API.

#### Definition

```graphql
directive @conversation(aiModel: String, sessionModel: SessionModel, eventModel: EventModel) on MUTATION
```


### Access Patterns

# Conversation Access Patterns

- Get conversation by ID + owner
   - GSI
      - PK: conversationID
   - Query
      - index: ConversationID-createdAt
      - filter-expression: AuthFilter
      - values: conversationID
- List conversations by owner
   - Scan
      - filter-expression: AuthFilter
- List user and assistant messages by conversation ID + owner sorted by createdAt
   - GSI
      - PK: conversationID
      - SK: createdAt (maybe id as UUIDv7)
   - Query
      - index: ConversationID-createdAt
      - ScanIndexForward: false
      - filter-expression: AuthFilter
      - values: conversationID
- List all messages where user message has an assistant response by conversation ID + owner + user message ID sorted by createdAt
   - GSI
      - PK: conversationID
      - SK: role#createdAt / role#id (v7)
   - Query
      - index: ConversationID-role#createdAt
      - filter-expression: AuthFilter
- Get amount of messages for a conversation by conversation ID + owner
   - Can this be retrieved via for an item collection?
- Get last message createdAt for a conversation by conversation ID + owner.
   - GSI
      - PK: owner
      - SK: conversationID
   - Query -
      - index: ConversationID-createdAt
      - filter-expression: AuthFilter
      - ScanIndexForward: false
      - limit: 1
      - values: conversationID

### Notes

- owner PKs won’t work because we need to check multiple possible values. There’s no OR operator when querying tables.

## Single table for conversation and messages.

```other
type Conversation @model(...) {
  messageID: ID! # table partition key

  conversationID: ID!
  userMessageID: ID!
  content: [ContentBlock]
  role: Role! # 'user' | 'assistant'

  owner: String
}
```

### Table

- partition key: id
- sort key: owner (why isn’t owner indexed today?)

### DDB Queries


[ { "M" : { "text" : { "S" : "Do you have a boat?" } } } ]


[
   {
      "M" : {
         "text" : {
            "S" : "Aye, I be the proud captain of a mighty galleon, the scourge of the seven seas! She be a fine ship, fit for any adventure."
            }
         }
      }
   ]